import { useState, useEffect, useCallback, useRef } from 'react'
import { getMesas, getPedidoAbierto } from '../api'
import PedidoCard from './PedidoCard'
import Icon from './Icon'

const POLL_MS  = 8_000
const MAX_HIST = 60

// Helpers localStorage
function loadHistorial() {
  try { return JSON.parse(localStorage.getItem('cb_historial') ?? '[]') } catch { return [] }
}
function saveHistorial(list) {
  try { localStorage.setItem('cb_historial', JSON.stringify(list)) } catch {}
}
function loadArchivedIds() {
  try { return new Set(JSON.parse(localStorage.getItem('cb_archived_ids') ?? '[]')) } catch { return new Set() }
}
function saveArchivedIds(set) {
  try { localStorage.setItem('cb_archived_ids', JSON.stringify([...set])) } catch {}
}

export default function KitchenBoard({ onLogout }) {
  const [pedidos, setPedidos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [error, setError]             = useState('')
  const [lastUpdate, setLastUpdate]   = useState(null)
  const [historial, setHistorial]     = useState(loadHistorial)
  const [showHistory, setShowHistory] = useState(false)

  /** IDs de pedidos ya archivados */
  const archivedIds = useRef(loadArchivedIds())

  const fetchOrders = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const mesas    = await getMesas()
      const occupied = mesas.filter(m => m.estado && m.estado !== 'LIBRE')
      const results  = await Promise.all(occupied.map(m => getPedidoAbierto(m.idMesa)))

      const open = results
        .filter(Boolean)
        .sort((a, b) => (a.fechaHora ?? '').localeCompare(b.fechaHora ?? ''))

      const displayList = []
      const toArchive   = []
      const openIds     = new Set(open.map(p => p.idPedido))

      // Limpiar archivedIds de pedidos que ya no existen como abiertos
      // (p.ej. el pedido fue cobrado y la mesa está libre)
      for (const id of archivedIds.current) {
        if (!openIds.has(id)) archivedIds.current.delete(id)
      }

      for (const pedido of open) {
        const lineas    = pedido.detalles ?? []
        const allDone   = lineas.length > 0 &&
          lineas.every(l => l.estado === 'LISTO' || l.estado === 'SERVIDO')
        const hasNewItems = lineas.some(l => l.estado === 'RECIBIDO')

        if (archivedIds.current.has(pedido.idPedido)) {
          // Pedido ya archivado
          if (hasNewItems) {
            // El camarero añadió nuevas líneas -> vuelve al tablero
            archivedIds.current.delete(pedido.idPedido)
            displayList.push(pedido)
          }
          // Si no hay líneas nuevas: permanece oculto, no se re-archiva
        } else {
          // Pedido activo
          if (allDone) {
            // Todos los platos listos -> archivar ahora mismo
            archivedIds.current.add(pedido.idPedido)
            toArchive.push({ ...pedido, archivedAt: new Date().toISOString() })
          } else {
            displayList.push(pedido)
          }
        }
      }

      // Persistir el conjunto de IDs archivados
      saveArchivedIds(archivedIds.current)

      // Añadir al historial los pedidos recién archivados
      if (toArchive.length > 0) {
        setHistorial(prev => {
          const updated = [...toArchive, ...prev].slice(0, MAX_HIST)
          saveHistorial(updated)
          return updated
        })
      }

      setPedidos(displayList)
      setLastUpdate(new Date())
      setError('')
    } catch (err) {
      setError(err.message || 'Error al cargar pedidos.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, POLL_MS)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Estadísticas
  const stats = pedidos.reduce((acc, p) => {
    const lineas = p.detalles ?? []
    acc.pendiente   += lineas.filter(l => (l.estado ?? 'RECIBIDO') === 'RECIBIDO').length
    acc.preparacion += lineas.filter(l => l.estado === 'PREPARACION').length
    acc.listo       += lineas.filter(l => l.estado === 'LISTO').length
    return acc
  }, { pendiente: 0, preparacion: 0, listo: 0 })

  const criticalCount = pedidos.filter(p => {
    if (!p.fechaHora) return false
    return Math.floor((Date.now() - new Date(p.fechaHora).getTime()) / 60_000) >= 20
  }).length

  function clearHistorial() {
    setHistorial([])
    saveHistorial([])
    // NO limpiamos archivedIds: los pedidos siguen ocultos en el tablero
  }

  return (
    <div className="board-wrap">

      {/* Cabecera */}
      <header className="board-header">
        <div className="board-header-left">
          <span className="board-logo"><img src="/logo.png" alt="Corebar" /></span>
          <div>
            <h1 className="board-title">
              Cocina
              <span className="board-title-sep"> · </span>
              <span className="board-title-brand">Corebar</span>
            </h1>
            <p className="board-sub">
              {loading && pedidos.length === 0
                ? 'Cargando…'
                : `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''} abierto${pedidos.length !== 1 ? 's' : ''}`
              }
              {criticalCount > 0 && (
                <span className="badge-inline badge-critical">
                  {criticalCount} urgente{criticalCount !== 1 ? 's' : ''}
                </span>
              )}
              {lastUpdate && (
                <span className="text-muted">
                  {' · '}{lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="board-header-right">
          <button
            className={`btn-refresh${refreshing ? ' btn-refresh--spinning' : ''}`}
            onClick={() => fetchOrders(true)}
            title="Actualizar ahora"
            disabled={refreshing}
          >
            <Icon name="refresh" size={18} />
          </button>
          <Clock />
          <button className="btn-logout" onClick={onLogout} title="Cerrar sesión">
            Salir
          </button>
        </div>
      </header>

      {/* Barra de estadísticas */}
      {!loading && pedidos.length > 0 && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value stat-value--pending">{stats.pendiente}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value stat-value--prep">{stats.preparacion}</span>
            <span className="stat-label">Preparando</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value stat-value--listo">{stats.listo}</span>
            <span className="stat-label">Listos</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{pedidos.length}</span>
            <span className="stat-label">Mesas</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="alert-error board-alert">{error}</div>}

      {/* Sin pedidos activos */}
      {!loading && pedidos.length === 0 && !error && (
        <div className="empty-state">
          <span className="empty-icon"><Icon name="ticket" size={42} /></span>
          <p>No hay pedidos activos</p>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Se actualiza cada {POLL_MS / 1000} s
            {historial.length > 0 && (
              <>
                {' · '}
                <button className="btn-hist-inline" onClick={() => setShowHistory(true)}>
                  Ver historial ({historial.length})
                </button>
              </>
            )}
          </p>
        </div>
      )}

      {/* Grid de pedidos */}
      <div className="board-grid">
        {pedidos.map(pedido => (
          <PedidoCard
            key={pedido.idPedido}
            pedido={pedido}
            onLineUpdated={fetchOrders}
          />
        ))}
      </div>

      {/* Leyenda */}
      {pedidos.length > 0 && (
        <footer className="board-legend">
          <span className="badge badge-pendiente">Recibido</span>
          <span className="badge badge-en-preparacion">Preparando</span>
          <span className="badge badge-listo">Listo</span>
          <span className="badge badge-en-servido">Servido</span>
          <span className="legend-sep" />
          <span className="legend-urgency legend-urgency--mild">■ 5–10 min</span>
          <span className="legend-urgency legend-urgency--warning">■ 10–20 min</span>
          <span className="legend-urgency legend-urgency--critical">■ +20 min</span>
          <span className="legend-hint">Toca una línea para avanzar su estado</span>
        </footer>
      )}

      {/* FAB historial */}
      <button
        className="fab-historial"
        onClick={() => setShowHistory(true)}
        title="Historial de pedidos completados"
        aria-label="Historial de pedidos completados"
      >
        <span className="fab-icon"><Icon name="history" size={22} /></span>
        {historial.length > 0 && (
          <span className="fab-badge">{historial.length}</span>
        )}
      </button>

      {/* Panel historial */}
      {showHistory && (
        <HistoryPanel
          historial={historial}
          onClose={() => setShowHistory(false)}
          onClear={clearHistorial}
        />
      )}
    </div>
  )
}

// Reloj
function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1_000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="board-clock">
      {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

// Panel lateral historial
function HistoryPanel({ historial, onClose }) {
  return (
    <div className="history-overlay">
      <aside className="history-panel" onClick={e => e.stopPropagation()}>

        <div className="history-header">
          <div>
            <h2 className="history-title">Historial</h2>
            <p className="history-sub">
              {historial.length} pedido{historial.length !== 1 ? 's' : ''} completado{historial.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="history-header-actions">
            <button className="btn-close-hist" onClick={onClose} title="Cerrar"><Icon name="close" size={18} /></button>
          </div>
        </div>

        <div className="history-list">
          {historial.length === 0 && (
            <div className="history-empty">
              <Icon name="inbox" size={40} />
              <p>Sin pedidos en el historial</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Los pedidos completados aparecerán aquí automáticamente
              </p>
            </div>
          )}
          {historial.map((pedido, i) => (
            <HistoryItem key={`${pedido.idPedido}-${i}`} pedido={pedido} />
          ))}
        </div>

      </aside>
    </div>
  )
}

function HistoryItem({ pedido }) {
  const archivedAt = pedido.archivedAt ? new Date(pedido.archivedAt) : null
  const lineas     = pedido.detalles ?? []

  return (
    <div className="history-item">
      <div className="history-item-header">
        <span className="history-mesa">Mesa {pedido.numeroMesa ?? pedido.idMesa}</span>
        <div className="history-item-meta">
          <span className="history-id">#{pedido.idPedido}</span>
          {archivedAt && (
            <span className="history-time">
              <Icon name="check" size={14} /> {archivedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {pedido.nombreUsuario && (
        <div className="history-waiter"><Icon name="user" size={13} /> {pedido.nombreUsuario}</div>
      )}

      <ul className="history-lineas">
        {lineas.map(l => (
          <li key={l.idDetalle} className="history-linea">
            <span className="history-linea-qty">{l.cantidad}×</span>
            <span className="history-linea-nombre">{l.nombreProducto}</span>
            {l.notas && <span className="history-linea-nota">— {l.notas}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
