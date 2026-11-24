package com.example.corebar.data.remote.dto

import com.google.gson.annotations.SerializedName

data class MesaDto(
    val idMesa: Int?,
    val numero: Int?,
    val capacidad: Int?,
    val estado: String?,
    /** Coordenadas en sala (backend); necesarias en PUT para no sobrescribirlas a 0. */
    val posX: Double? = null,
    val posY: Double? = null,
    /** Id del camarero con pedido ABIERTO en esta mesa. null = libre / sin pedido activo. */
    val idCamareroActual: Int? = null,
)

/** Cuerpo de POST/PUT `/api/mesas` y `/api/mesas/{id}` (coincide con `MesaRequest` en Spring). */
data class MesaRequestBody(
    val numero: Int,
    val capacidad: Int,
    val estado: String? = null,
    val posX: Double? = null,
    val posY: Double? = null,
)

data class UsuarioDto(
    val idUsuario: Int?,
    val nombre: String?,
    val username: String?,
    val rol: String?,
    val activo: Boolean?,
)

data class ProductoDto(
    val idProducto: Int?,
    val idCategoria: Int?,
    val nombreCategoria: String?,
    val nombre: String?,
    val descripcion: String?,
    val precio: Double?,
    val stockActual: Int?,
    val porcentajeIva: Int?,
    val imagenUrl: String? = null,
)

data class PedidoCreateBody(
    val idMesa: Int,
    val idUsuario: Int,
)

data class DetallePedidoBody(
    val idProducto: Int,
    val cantidad: Int,
    val notas: String? = null,
    val precioUnitario: Double? = null,
)

data class DetallePedidoDto(
    val idDetalle: Int?,
    val idPedido: Int?,
    val idProducto: Int?,
    val nombreProducto: String?,
    val cantidad: Int?,
    val notas: String?,
    val precioUnitario: Double?,
    val estado: String?,
)

data class PedidoDto(
    val idPedido: Int?,
    val idMesa: Int?,
    val numeroMesa: Int?,
    val idUsuario: Int?,
    val nombreUsuario: String?,
    val fechaHora: String?,
    val estado: String?,
    val total: Double?,
    val idFactura: Int?,
    val detalles: List<DetallePedidoDto>?,
)

data class FacturaCreateBody(
    val idPedido: Int,
    val metodoPago: String,
)

data class FacturaDto(
    val idFactura: Int?,
    val idPedido: Int?,
    val metodoPago: String?,
    val total: Double?,
    val fechaHora: String?,
)

/** Cuerpo para PATCH .../detalles/{id}/estado */
data class EstadoLineaBody(val estado: String)

data class ApiErrorBody(
    @SerializedName("error") val error: String?,
)
