// API client
// En desarrollo el proxy de Vite redirige /api a http://localhost:8080.
// En producción se usa VITE_API_HOST o, si no existe, la URL del servidor.
const BASE = import.meta.env.VITE_API_HOST ?? 'https://api.corebar.es'

export function setToken(t) {
  localStorage.setItem('cb_token', t)
}

export function getToken() {
  return localStorage.getItem('cb_token') ?? ''
}

export function clearToken() {
  localStorage.removeItem('cb_token')
}

async function req(method, path, body) {
  // Leemos siempre de localStorage para garantizar el token más reciente
  const token = localStorage.getItem('cb_token') ?? ''

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const opts = { method, headers }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)

  // 204 No Content -> sin cuerpo
  if (res.status === 204) return null

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    throw new Error(data?.error ?? data?.message ?? `Error ${res.status}`)
  }
  return data
}

// Auth
// Respuesta: { accessToken, tokenType, expiresIn, usuario: { idUsuario, nombre, username, rol } }
export const login = (username, password) =>
  req('POST', '/api/auth/login', { username, password })

// Mesas
export const getMesas = () => req('GET', '/api/mesas')

// Pedidos
// Devuelve el pedido abierto de esa mesa, o null si no hay ninguno (404)
export const getPedidoAbierto = async (idMesa) => {
  try {
    return await req('GET', `/api/pedidos/mesa/${idMesa}/abierto`)
  } catch {
    return null
  }
}

// Líneas
// PATCH /api/pedidos/{idPedido}/detalles/{idDetalle}/estado
// Body: { "estado": "RECIBIDO" | "PREPARACION" | "LISTO" | "SERVIDO" }
export const updateLineaEstado = (idPedido, idDetalle, estado) =>
  req('PATCH', `/api/pedidos/${idPedido}/detalles/${idDetalle}/estado`, { estado })

// Productos
// PATCH /api/productos/{idProducto}/disponibilidad
// Body: { "disponible": false }
// Necesita endpoint en el backend: @PatchMapping("/{id}/disponibilidad")
// PATCH /api/productos/{id}/agotado -> pone stockActual = 0
// Devuelve { idProducto, previousStock, stockActual:0 }
export const marcarProductoAgotado = (idProducto) =>
  req('PATCH', `/api/productos/${idProducto}/agotado`)

// PATCH /api/productos/{id}/stock -> restaura el stock a un valor concreto
export const restaurarStockProducto = (idProducto, stockActual) =>
  req('PATCH', `/api/productos/${idProducto}/stock`, { stockActual })
