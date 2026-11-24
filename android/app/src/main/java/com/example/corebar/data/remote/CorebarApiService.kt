package com.example.corebar.data.remote

import com.example.corebar.data.remote.dto.AuthResponseDto
import com.example.corebar.data.remote.dto.DetallePedidoBody
import com.example.corebar.data.remote.dto.EstadoLineaBody
import com.example.corebar.data.remote.dto.DetallePedidoDto
import com.example.corebar.data.remote.dto.FacturaCreateBody
import com.example.corebar.data.remote.dto.FacturaDto
import com.example.corebar.data.remote.dto.LoginRequestBody
import com.example.corebar.data.remote.dto.MesaDto
import com.example.corebar.data.remote.dto.MesaRequestBody
import com.example.corebar.data.remote.dto.PedidoCreateBody
import com.example.corebar.data.remote.dto.PedidoDto
import com.example.corebar.data.remote.dto.ProductoDto
import com.example.corebar.data.remote.dto.UsuarioAuthDto
import com.example.corebar.data.remote.dto.UsuarioDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface CorebarApiService {

    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequestBody): Response<AuthResponseDto>

    @GET("api/auth/me")
    suspend fun authMe(): Response<UsuarioAuthDto>

    @GET("api/mesas")
    suspend fun listarMesas(): List<MesaDto>

    @GET("api/mesas/{id}")
    suspend fun obtenerMesa(@Path("id") id: Int): Response<MesaDto>

    @PUT("api/mesas/{id}")
    suspend fun actualizarMesa(@Path("id") id: Int, @Body body: MesaRequestBody): Response<MesaDto>

    @GET("api/usuarios")
    suspend fun listarUsuarios(): List<UsuarioDto>

    @GET("api/productos")
    suspend fun listarProductos(): List<ProductoDto>

    @GET("api/pedidos/mesa/{idMesa}/abierto")
    suspend fun pedidoAbiertoPorMesa(@Path("idMesa") idMesa: Int): Response<PedidoDto>

    @POST("api/pedidos")
    suspend fun crearPedido(@Body body: PedidoCreateBody): Response<PedidoDto>

    @GET("api/pedidos/{id}")
    suspend fun obtenerPedido(@Path("id") id: Int): PedidoDto

    @POST("api/pedidos/{id}/detalles")
    suspend fun agregarLinea(
        @Path("id") idPedido: Int,
        @Body body: DetallePedidoBody,
    ): DetallePedidoDto

    @DELETE("api/pedidos/{idPedido}/detalles/{idDetalle}")
    suspend fun eliminarLinea(
        @Path("idPedido") idPedido: Int,
        @Path("idDetalle") idDetalle: Int,
    ): Response<Unit>

    @POST("api/facturas")
    suspend fun crearFactura(@Body body: FacturaCreateBody): Response<FacturaDto>

    @GET("api/pedidos/camarero/{usuarioId}/abiertos")
    suspend fun pedidosCamarero(@Path("usuarioId") usuarioId: Int): List<PedidoDto>

    @PATCH("api/pedidos/{idPedido}/detalles/{idDetalle}/estado")
    suspend fun cambiarEstadoLinea(
        @Path("idPedido") idPedido: Int,
        @Path("idDetalle") idDetalle: Int,
        @Body body: EstadoLineaBody,
    ): DetallePedidoDto
}
