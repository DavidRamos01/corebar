import client from './client'
import { cached, invalidate, invalidateAll, readSync } from './cache'
import { bumpVersion } from './version'

function broadcast() {
  invalidateAll()
  bumpVersion()
  window.dispatchEvent(new Event('corebar:data'))
}
import type {
  LoginResponse, ProductoResponse, CategoriaResponse,
  UsuarioResponse, MesaResponse, PedidoResponse, FacturaResponse,
} from './types'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  client.post<any>('/auth/login', { username, password }).then(r => ({
    token:     r.data.accessToken ?? r.data.token,
    type:      r.data.tokenType   ?? r.data.type,
    expiresIn: r.data.expiresIn,
    profile:   r.data.usuario     ?? r.data.profile,
  } as LoginResponse))

export const getMe = () => client.get('/auth/me').then(r => r.data)

// ── Helpers: transforma respuesta plana → tipos anidados ─────────────────────
function toDetalle(d: any) {
  return {
    idDetallePedido: d.idDetalle ?? d.idDetallePedido,
    producto: {
      idProducto:    d.idProducto,
      nombre:        d.nombreProducto ?? d.producto?.nombre ?? '—',
      descripcion:   d.producto?.descripcion ?? null,
      precio:        d.precioUnitario,
      stockActual:   0,
      porcentajeIva: 0,
      imagenUrl:     null,
      categoria:     d.producto?.categoria ?? { idCategoria: 0, nombre: '' },
    },
    cantidad:       d.cantidad,
    precioUnitario: d.precioUnitario,
    estado:         d.estado,
    notas:          d.notas ?? null,
  }
}

function toPedido(p: any): PedidoResponse {
  return {
    idPedido:      p.idPedido,
    mesa:          p.mesa ?? { idMesa: p.idMesa, numero: p.numeroMesa ?? p.idMesa, capacidad: 0, estado: 'LIBRE', posX: 0, posY: 0, idCamarero: null },
    usuario:       p.usuario ?? (p.nombreUsuario ? { idUsuario: p.idUsuario, nombre: p.nombreUsuario, username: '', rol: 'CAMARERO' as const } : null),
    estado:        p.estado,
    total:         p.total,
    fechaCreacion: p.fechaCreacion ?? p.fechaHora ?? null,
    detalles:      (p.detalles ?? []).map(toDetalle),
  }
}

// Session-scoped TTL — data loaded at login, only invalidated by mutations or F5 reload
const SESSION = Number.MAX_SAFE_INTEGER

// ── Categorías ────────────────────────────────────────────────────────────────
export const getCategorias = () =>
  cached('categorias', SESSION, () => client.get<CategoriaResponse[]>('/categorias').then(r => r.data))

export const createCategoria = (nombre: string) =>
  client.post<CategoriaResponse>('/categorias', { nombre }).then(r => { broadcast(); return r.data })

export const updateCategoria = (id: number, nombre: string) =>
  client.put<CategoriaResponse>(`/categorias/${id}`, { nombre }).then(r => { broadcast(); return r.data })

export const deleteCategoria = (id: number) =>
  client.delete(`/categorias/${id}`).then(r => { broadcast(); return r })

// ── Productos ─────────────────────────────────────────────────────────────────
// Backend returns flat { idCategoria, nombreCategoria } — map to nested { categoria }
function toProducto(p: any): ProductoResponse {
  return {
    idProducto:    p.idProducto,
    nombre:        p.nombre,
    descripcion:   p.descripcion ?? null,
    precio:        typeof p.precio === 'object' ? Number(p.precio) : Number(p.precio),
    stockActual:   p.stockActual,
    porcentajeIva: p.porcentajeIva,
    imagenUrl:     p.imagenUrl ?? null,
    categoria:     p.categoria ?? (p.idCategoria
      ? { idCategoria: p.idCategoria, nombre: p.nombreCategoria ?? 'Sin categoría' }
      : { idCategoria: 0, nombre: 'Sin categoría' }),
  }
}

export const getProductos = (categoriaId?: number) =>
  cached('productos', SESSION, () =>
    client.get<any[]>('/productos', { params: categoriaId ? { categoriaId } : {} })
      .then(r => r.data.map(toProducto))
  )

export const createProducto = (data: {
  nombre: string; descripcion?: string; precio: number
  stockActual: number; porcentajeIva: number; idCategoria: number; imagenUrl?: string
}) => client.post<any>('/productos', data).then(r => { broadcast(); return toProducto(r.data) })

export const updateProducto = (id: number, data: Partial<{
  nombre: string; descripcion: string; precio: number
  stockActual: number; porcentajeIva: number; idCategoria: number; imagenUrl: string
}>) => client.put<any>(`/productos/${id}`, data).then(r => { broadcast(); return toProducto(r.data) })

export const updateStock = (id: number, stockActual: number) =>
  client.patch<ProductoResponse>(`/productos/${id}/stock`, { stockActual }).then(r => { broadcast(); return r.data })

export const marcarAgotado = (id: number) =>
  client.patch(`/productos/${id}/agotado`).then(r => { broadcast(); return r.data })

export const deleteProducto = (id: number) =>
  client.delete(`/productos/${id}`).then(r => { broadcast(); return r })

export const uploadImagen = (file: File): Promise<string> => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post<{ url: string }>('/upload/imagen', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data.url)
}

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const getUsuarios = () =>
  cached('usuarios', SESSION, () => client.get<UsuarioResponse[]>('/usuarios').then(r => r.data))

export const createUsuario = (data: {
  nombre: string; username: string; password: string; rol: string; activo: boolean
}) => client.post<UsuarioResponse>('/usuarios', data).then(r => { broadcast(); return r.data })

export const updateUsuario = (id: number, data: Partial<{
  nombre: string; username: string; password: string; rol: string; activo: boolean
}>) => client.put<UsuarioResponse>(`/usuarios/${id}`, data).then(r => { broadcast(); return r.data })

export const deleteUsuario = (id: number) =>
  client.delete(`/usuarios/${id}`).then(r => { broadcast(); return r })

// ── Mesas ─────────────────────────────────────────────────────────────────────
export const getMesas = () =>
  cached('mesas', SESSION, () => client.get<MesaResponse[]>('/mesas').then(r => r.data))

export const createMesa = (data: {
  numero: number; capacidad: number; estado: string; posX: number; posY: number
}) => client.post<MesaResponse>('/mesas', data).then(r => { broadcast(); return r.data })

export const updateMesaEstado = (id: number, estado: string) =>
  client.patch<MesaResponse>(`/mesas/${id}/estado`, { estado }).then(r => { broadcast(); return r.data })

export const deleteMesa = (id: number) =>
  client.delete(`/mesas/${id}`).then(r => { broadcast(); return r })

// ── Pedidos ───────────────────────────────────────────────────────────────────
const _fetchPedidos = (params?: { mesaId?: number; estado?: string }) =>
  client.get<any[]>('/pedidos', { params }).then(r => r.data.map(toPedido))

export const getPedidos = (params?: { mesaId?: number; estado?: string }) => {
  const key = `pedidos:${JSON.stringify(params ?? {})}`
  return cached(key, SESSION, () => _fetchPedidos(params))
}

export const getPedido = (id: number) =>
  cached(`pedido:${id}`, SESSION, () =>
    client.get<any>(`/pedidos/${id}`).then(r => toPedido(r.data))
  )

export const getPedidoAbiertoMesa = (mesaId: number) =>
  client.get<any>(`/pedidos/mesa/${mesaId}/abierto`).then(r => toPedido(r.data))

export const cambiarEstadoPedido = (id: number, estado: string) =>
  client.patch(`/pedidos/${id}/estado`, { estado }).then(r => { broadcast(); return r.data })

export const cambiarEstadoDetalle = (pedidoId: number, detalleId: number, estado: string) =>
  client.patch(`/pedidos/${pedidoId}/detalles/${detalleId}/estado`, { estado }).then(r => r.data)

// ── Facturas ──────────────────────────────────────────────────────────────────
const _buildFacturas = async (): Promise<FacturaResponse[]> => {
  const [facturasRaw, pedidosRaw] = await Promise.all([
    client.get<any[]>('/facturas').then(r => r.data),
    client.get<any[]>('/pedidos').then(r => r.data),
  ])
  const pedidoMap = new Map<number, PedidoResponse>(pedidosRaw.map(p => [p.idPedido, toPedido(p)]))
  return facturasRaw.map(f => ({
    idFactura:    f.idFactura,
    pedido:       pedidoMap.get(f.idPedido) ?? null as any,
    metodoPago:   f.metodoPago,
    subtotal:     f.subtotal,
    totalIva:     f.totalIva,
    total:        f.total,
    fechaEmision: f.fechaEmision ?? null,
  }))
}

export const getFacturas = () => cached('facturas', SESSION, _buildFacturas)

export const getFactura = (id: number) =>
  client.get<any>(`/facturas/${id}`).then(async f => {
    const pedidosRaw = await client.get<any[]>('/pedidos').then(r => r.data)
    const pedidoMap  = new Map<number, PedidoResponse>(pedidosRaw.map(p => [p.idPedido, toPedido(p)]))
    return {
      idFactura: f.data.idFactura, pedido: pedidoMap.get(f.data.idPedido) ?? null as any,
      metodoPago: f.data.metodoPago, subtotal: f.data.subtotal, totalIva: f.data.totalIva,
      total: f.data.total, fechaEmision: f.data.fechaEmision ?? null,
    } as FacturaResponse
  })

export const getFacturaPorPedido = (pedidoId: number) =>
  client.get<FacturaResponse>(`/facturas/pedido/${pedidoId}`).then(r => r.data)

export const createFactura = (idPedido: number, metodoPago: string) =>
  client.post<FacturaResponse>('/facturas', { idPedido, metodoPago }).then(r => { broadcast(); return r.data })

// ── Product stats — individual pedidos with full detalles ─────────────────────
/**
 * Fetches every pedido individually via /pedidos/{id} which returns nested detalles.
 * The list endpoint (/pedidos) omits detalles, so we need per-ID fetches.
 * All individual results are cached at SESSION TTL.
 * Stored as 'pedidos:detailed' for Dashboard top-products aggregation.
 */
export const getDetailedPedidos = () =>
  cached('pedidos:detailed', SESSION, async () => {
    const pedidos = await getPedidos()
    const results = await Promise.allSettled(
      pedidos.map(p => getPedido(p.idPedido))
    )
    return results
      .filter((r): r is PromiseFulfilledResult<PedidoResponse> => r.status === 'fulfilled')
      .map(r => r.value)
  })

export const getDetailedPedidosSync = () => readSync<PedidoResponse[]>('pedidos:detailed', SESSION)

// ── Preloading ─────────────────────────────────────────────────────────────────
/** Warms the cache for all major endpoints in parallel. Resolves when all settle. */
export const preloadAll = () =>
  Promise.allSettled([
    getCategorias(),
    getProductos(),
    getUsuarios(),
    getMesas(),
    getPedidos(),
    getFacturas(),
    getDetailedPedidos(),
  ])

// ── Sync cache reads (instant initial state after preload) ────────────────────
export const getCategoriasSync = () => readSync<CategoriaResponse[]>('categorias', SESSION)
export const getProductosSync  = () => readSync<ProductoResponse[]>('productos', SESSION)
export const getUsuariosSync   = () => readSync<UsuarioResponse[]>('usuarios', SESSION)
export const getMesasSync      = () => readSync<MesaResponse[]>('mesas', SESSION)
export const getFacturasSync   = () => readSync<FacturaResponse[]>('facturas', SESSION)
export const getPedidosSync    = (params?: { mesaId?: number; estado?: string }) =>
  readSync<PedidoResponse[]>(`pedidos:${JSON.stringify(params ?? {})}`, SESSION)
