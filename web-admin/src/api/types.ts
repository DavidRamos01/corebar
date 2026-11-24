// ── API response types matching the Spring Boot DTOs ─────────────────────────

export interface AuthUser {
  idUsuario: number
  nombre: string
  username: string
  rol: 'ADMIN' | 'CAMARERO' | 'COCINERO'
}

export interface LoginResponse {
  token: string
  type: string
  expiresIn: number
  profile: AuthUser
}

export interface CategoriaResponse {
  idCategoria: number
  nombre: string
}

export interface ProductoResponse {
  idProducto: number
  nombre: string
  descripcion: string | null
  precio: number
  stockActual: number
  porcentajeIva: number
  imagenUrl: string | null
  categoria: CategoriaResponse
}

export interface UsuarioResponse {
  idUsuario: number
  nombre: string
  username: string
  rol: string
  activo: boolean
}

export interface MesaResponse {
  idMesa: number
  numero: number
  capacidad: number
  estado: 'LIBRE' | 'OCUPADA' | 'RESERVADA'
  posX: number
  posY: number
  idCamarero: number | null
}

export interface DetallePedidoResponse {
  idDetallePedido: number
  producto: ProductoResponse
  cantidad: number
  precioUnitario: number
  estado: 'PENDIENTE' | 'EN_PREPARACION' | 'SERVIDO' | 'CANCELADO'
  notas: string | null
}

export interface PedidoResponse {
  idPedido: number
  mesa: MesaResponse
  usuario: AuthUser
  estado: 'ABIERTO' | 'PAGADO'
  total: number
  detalles: DetallePedidoResponse[]
  fechaCreacion?: string
}

export interface FacturaResponse {
  idFactura: number
  pedido: PedidoResponse
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'BIZUM'
  subtotal: number
  totalIva: number
  total: number
  fechaEmision?: string
}
