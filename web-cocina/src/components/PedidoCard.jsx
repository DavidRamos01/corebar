import { useState } from 'react'
import { updateLineaEstado, marcarProductoAgotado, restaurarStockProducto } from '../api'
import Icon from './Icon'

// Ciclo de estados al tocar una línea (LISTO es el estado final en cocina)
const NEXT_ESTADO = {
  RECIBIDO:    'PREPARACION',
  PREPARACION: 'LISTO',
  // LISTO es estado final, el camarero marca SERVIDO desde su app
}

const ESTADO_LABEL = {
  RECIBIDO:    'Recibido',
  PREPARACION: 'Preparando',
  LISTO:       'Listo',
  SERVIDO:     'Servido',
}

const ESTADO_CSS = {
  RECIBIDO:    'en-pendiente',
  PREPARACION: 'en-preparacion',
  LISTO:       'en-listo',
  SERVIDO:     'en-servido',
}

function minutesAgo(fechaHora) {
  if (!fechaHora) return null
  return Math.floor((Date.now() - new Date(fechaHora).getTime()) / 60_000)
}

/** Nivel de urgencia basado en minutos de espera */
function urgencyLevel(mins) {
  if (mins === null) return 'normal'
  if (mins >= 20) return 'critical'
  if (mins >= 10) return 'warning'
  if (mins >=  5) return 'mild'
  return 'fresh'
}

/** Detecta notas que impliquen alergias o intolerancias */
function isAllergyNote(note) {
  if (!note) return false
  const l = note.toLowerCase()
  return (
    l.includes('alerg') ||
    l.includes('intoler') ||
    l.includes('celíac') ||
    l.includes('celiac') ||
    l.includes('sin gluten') ||
    l.includes('lactosa') ||
    l.includes('vegano') ||
    l.includes('vegetarian')
  )
}

export default function PedidoCard({ pedido, onLineUpdated }) {
  const [localStates, setLocalStates] = useState({})
  const [updating, setUpdating]       = useState(null)
  const [lineError, setLineError]     = useState('')
  // { [idProducto]: { isAgotado: true, previousStock: N } }
  const [agotados, setAgotados]     = useState({})
  const [agotadoErr, setAgotadoErr] = useState('')

  const lineas  = pedido.detalles ?? []
  const mins    = minutesAgo(pedido.fechaHora)
  const urgLvl  = urgencyLevel(mins)

  // Para la cocina, un plato "terminado" es LISTO o SERVIDO (ya entregado por el camarero)
  const allListo = lineas.length > 0 && lineas.every(l => {
    const st = localStates[l.idDetalle] ?? l.estado ?? 'RECIBIDO'
    return st === 'LISTO' || st === 'SERVIDO'
  })

  const pendingCount = lineas.filter(l => {
    const st = localStates[l.idDetalle] ?? l.estado ?? 'RECIBIDO'
    return st === 'RECIBIDO'
  }).length

  const prepCount = lineas.filter(l => {
    const st = localStates[l.idDetalle] ?? l.estado ?? 'RECIBIDO'
    return st === 'PREPARACION'
  }).length

  // Cambio de estado de línea
  async function handleLineClick(linea) {
    if (updating === linea.idDetalle) return
    const current = localStates[linea.idDetalle] ?? linea.estado ?? 'RECIBIDO'
    const next    = NEXT_ESTADO[current]
    // LISTO y SERVIDO son estados finales para cocina, no avanzar más
    if (!next) return

    setLocalStates(prev => ({ ...prev, [linea.idDetalle]: next }))
    setUpdating(linea.idDetalle)
    setLineError('')

    try {
      await updateLineaEstado(pedido.idPedido, linea.idDetalle, next)
      onLineUpdated()
    } catch (err) {
      setLocalStates(prev => ({ ...prev, [linea.idDetalle]: current }))
      setLineError(err.message || 'No se pudo actualizar el estado.')
    } finally {
      setUpdating(null)
    }
  }

  // Marcar / restaurar stock
  async function handleAgotado(e, linea) {
    e.stopPropagation()
    const pid = linea.idProducto
    if (!pid) return
    setAgotadoErr('')

    if (agotados[pid]?.isAgotado) {
      // Restaurar stock anterior
      const prev = agotados[pid].previousStock ?? 0
      try {
        await restaurarStockProducto(pid, prev)
        setAgotados(s => { const n = { ...s }; delete n[pid]; return n })
      } catch (err) {
        setAgotadoErr(err.message || 'No se pudo restaurar el stock.')
        setTimeout(() => setAgotadoErr(''), 3500)
      }
    } else {
      // Marcar como agotado
      try {
        const res = await marcarProductoAgotado(pid)
        const previousStock = res?.previousStock ?? 0
        setAgotados(s => ({ ...s, [pid]: { isAgotado: true, previousStock } }))
      } catch (err) {
        setAgotadoErr(err.message || 'No se pudo marcar como agotado.')
        setTimeout(() => setAgotadoErr(''), 3500)
      }
    }
  }

  return (
    <div className={[
      'pedido-card',
      `pedido-card--${urgLvl}`,
      allListo ? 'pedido-card--done' : '',
    ].filter(Boolean).join(' ')}>

      {/* Franja de urgencia */}
      <div className={`urgency-stripe urgency-stripe--${urgLvl}`} />

      {/* Cabecera */}
      <div className="pedido-header">
        <div className="pedido-header-left">
          <div className="pedido-mesa">Mesa {pedido.numeroMesa ?? pedido.idMesa}</div>
          {pedido.nombreUsuario && (
            <div className="pedido-waiter-tag">
              <Icon name="user" size={14} className="waiter-icon" />
              {pedido.nombreUsuario}
            </div>
          )}
        </div>

        <div className="pedido-meta">
          <span className="pedido-id">#{pedido.idPedido}</span>
          {mins !== null && (
            <span className={`pedido-time pedido-time--${urgLvl}`}>
              <Icon name="clock" size={15} /> {mins} min
            </span>
          )}
          {/* Badges de resumen rápido */}
          {pendingCount > 0 && !allListo && (
            <span className="mini-badge mini-badge--pending" title="Líneas pendientes">
              {pendingCount}
            </span>
          )}
          {prepCount > 0 && (
            <span className="mini-badge mini-badge--prep" title="En preparación">
              <Icon name="flame" size={13} />{prepCount}
            </span>
          )}
        </div>
      </div>

      {/* Errores */}
      {(lineError || agotadoErr) && (
        <div className="alert-error card-alert">
          {lineError || agotadoErr}
        </div>
      )}

      {/* Lista de líneas */}
      <ul className="lineas-list">
        {lineas.length === 0 && (
          <li className="linea-empty">Sin líneas</li>
        )}

        {lineas.map(linea => {
          const estado      = localStates[linea.idDetalle] ?? linea.estado ?? 'RECIBIDO'
          const isUpdating  = updating === linea.idDetalle
          const cssState    = ESTADO_CSS[estado] ?? 'en-pendiente'
          const hasAllergy  = isAllergyNote(linea.notas)
          const isAgotado   = agotados[linea.idProducto]?.isAgotado

          return (
            <li
              key={linea.idDetalle}
              className={[
                'linea-item',
                `linea-item--${cssState}`,
                isUpdating  ? 'linea-item--updating' : '',
                hasAllergy  ? 'linea-item--allergy'  : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleLineClick(linea)}
              title="Toca para cambiar el estado"
            >
              <span className="linea-qty">{linea.cantidad}×</span>

              <span className="linea-info">
                <span className="linea-nombre">{linea.nombreProducto}</span>
                {linea.notas && (
                  <span className={`linea-notas${hasAllergy ? ' linea-notas--allergy' : ''}`}>
                    {hasAllergy && <Icon name="alert" size={14} className="allergy-icon" />}
                    {linea.notas}
                  </span>
                )}
              </span>

              <div className="linea-right">
                <span className={`linea-badge badge-${cssState}`}>
                  {isUpdating ? 'Guardando…' : ESTADO_LABEL[estado] ?? estado}
                </span>

                {/* Botón agotado/restaurar, solo si el DTO trae idProducto */}
                {linea.idProducto != null && (
                  <button
                    className={`btn-agotado${isAgotado ? ' btn-agotado--active' : ''}`}
                    onClick={e => handleAgotado(e, linea)}
                    title={isAgotado
                      ? `Restaurar stock anterior (${agotados[linea.idProducto]?.previousStock ?? 0})`
                      : 'Marcar producto agotado'}
                  >
                    {isAgotado ? <Icon name="undo" size={16} /> : <Icon name="ban" size={16} />}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* Banner "listo para servir" */}
      {allListo && (
        <div className="pedido-done-banner">
          <Icon name="check" size={18} /> Pedido completo, listo para servir
        </div>
      )}
    </div>
  )
}
