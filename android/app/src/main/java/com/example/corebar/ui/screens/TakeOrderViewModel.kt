package com.example.corebar.ui.screens

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.corebar.data.auth.AuthTokenHolder
import com.example.corebar.data.remote.ApiClient
import com.example.corebar.data.remote.CorebarApiService
import com.example.corebar.data.remote.dto.DetallePedidoBody
import com.example.corebar.data.remote.dto.FacturaCreateBody
import com.example.corebar.data.remote.dto.MesaDto
import com.example.corebar.data.remote.dto.PedidoCreateBody
import com.example.corebar.data.remote.dto.PedidoDto
import com.example.corebar.data.remote.dto.ProductoDto
import com.example.corebar.data.remote.parseApiError
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

data class TakeOrderUiState(
    val mesas: List<MesaDto> = emptyList(),
    val productos: List<ProductoDto> = emptyList(),
    val usuarioCamareroId: Int? = null,
    val selectedMesaId: Int? = null,
    val currentPedido: PedidoDto? = null,
    val loading: Boolean = false,
    val error: String? = null,
    val pickingMesa: Boolean = true,
    val pedidoFinalizado: Boolean = false,
    /** true cuando existen mesas en el sistema pero todas tienen camarero asignado. */
    val allTablesOccupied: Boolean = false,
)

class TakeOrderViewModel : ViewModel() {

    var uiState by mutableStateOf(TakeOrderUiState())
        private set

    /** Evita abrir pedido dos veces si llegamos desde el mapa de mesas. */
    private var mapNavigationConsumed = false

    init {
        reloadInitial()
    }

    private suspend fun service(): CorebarApiService =
        withContext(Dispatchers.IO) { ApiClient.service }

    fun reloadInitial() {
        viewModelScope.launch {
            uiState = uiState.copy(loading = true, error = null)
            runCatching {
                val api = service()
                val todasMesas = api.listarMesas()
                val productos = api.listarProductos()
                val userId = AuthTokenHolder.profile?.idUsuario
                    ?: throw IllegalStateException("NO_SESSION")
                // Solo mesas sin camarero asignado o asignadas a este camarero
                val mesas = todasMesas.filter { m ->
                    m.idCamareroActual == null || m.idCamareroActual == userId
                }
                val allOccupied = todasMesas.isNotEmpty() && mesas.isEmpty()
                uiState = uiState.copy(
                    mesas = mesas,
                    productos = productos,
                    usuarioCamareroId = userId,
                    loading = false,
                    error = null,
                    allTablesOccupied = allOccupied,
                )
            }.onFailure { e ->
                val msg = if (e.message == "NO_SESSION") {
                    "NO_SESSION"
                } else {
                    e.message ?: "Error"
                }
                uiState = uiState.copy(loading = false, error = msg)
            }
        }
    }

    fun selectMesa(id: Int?) {
        uiState = uiState.copy(selectedMesaId = id, error = null)
    }

    /** Si la pantalla se abre con el id de una mesa (desde el mapa), la selecciona y abre el pedido */
    fun tryConsumeInitialMesaFromMap(mesaId: Int?) {
        if (mesaId == null || mesaId <= 0 || mapNavigationConsumed) return
        if (uiState.mesas.isEmpty()) return
        if (uiState.mesas.none { it.idMesa == mesaId }) return
        mapNavigationConsumed = true
        selectMesa(mesaId)
        openOrContinuePedido()
    }

    fun openOrContinuePedido() {
        val mesaId = uiState.selectedMesaId ?: return
        val usuarioId = uiState.usuarioCamareroId ?: return
        viewModelScope.launch {
            uiState = uiState.copy(loading = true, error = null)
            runCatching {
                val api = service()
                val abierto = api.pedidoAbiertoPorMesa(mesaId)
                if (abierto.isSuccessful) {
                    val body = abierto.body()
                    val id = body?.idPedido ?: throw IllegalStateException("Respuesta sin idPedido")
                    val full = api.obtenerPedido(id)
                    uiState = uiState.copy(
                        currentPedido = full,
                        pickingMesa = false,
                        loading = false,
                        error = null,
                    )
                    return@launch
                }
                if (abierto.code() == 404) {
                    val created = api.crearPedido(PedidoCreateBody(mesaId, usuarioId))
                    if (!created.isSuccessful) {
                        throw IllegalStateException(parseApiError(created))
                    }
                    val id = created.body()?.idPedido
                        ?: throw IllegalStateException("Respuesta sin idPedido")
                    val full = api.obtenerPedido(id)
                    uiState = uiState.copy(
                        currentPedido = full,
                        pickingMesa = false,
                        loading = false,
                        error = null,
                    )
                    return@launch
                }
                throw IllegalStateException(parseApiError(abierto))
            }.onFailure { e ->
                uiState = uiState.copy(loading = false, error = e.message)
            }
        }
    }

    fun addLine(productoId: Int, cantidad: Int, notas: String?) {
        val pedidoId = uiState.currentPedido?.idPedido ?: return
        if (cantidad <= 0) return
        viewModelScope.launch {
            uiState = uiState.copy(loading = true, error = null)
            runCatching {
                val api = service()
                api.agregarLinea(
                    pedidoId,
                    DetallePedidoBody(
                        idProducto = productoId,
                        cantidad = cantidad,
                        notas = notas?.takeIf { it.isNotBlank() },
                        precioUnitario = null,
                    ),
                )
                val full      = api.obtenerPedido(pedidoId)
                val productos = api.listarProductos()   // stock actualizado
                uiState = uiState.copy(
                    currentPedido = full,
                    productos = productos,
                    loading = false,
                    error = null,
                )
            }.onFailure { e ->
                uiState = uiState.copy(loading = false, error = e.message)
            }
        }
    }

    fun finalizarPedido(metodoPago: String) {
        val pedidoId = uiState.currentPedido?.idPedido ?: return
        viewModelScope.launch {
            uiState = uiState.copy(loading = true, error = null)
            runCatching {
                val api = service()
                val resp = api.crearFactura(FacturaCreateBody(idPedido = pedidoId, metodoPago = metodoPago))
                if (!resp.isSuccessful) throw IllegalStateException(parseApiError(resp))
                uiState = uiState.copy(loading = false, error = null, pedidoFinalizado = true)
            }.onFailure { e ->
                uiState = uiState.copy(loading = false, error = e.message)
            }
        }
    }

    fun deleteLine(idDetalle: Int?) {
        val pedidoId = uiState.currentPedido?.idPedido ?: return
        if (idDetalle == null) return
        viewModelScope.launch {
            uiState = uiState.copy(loading = true, error = null)
            runCatching {
                val api = service()
                api.eliminarLinea(pedidoId, idDetalle)
                val full      = api.obtenerPedido(pedidoId)
                val productos = api.listarProductos()   // stock devuelto al eliminar
                uiState = uiState.copy(
                    currentPedido = full,
                    productos = productos,
                    loading = false,
                    error = null,
                )
            }.onFailure { e ->
                uiState = uiState.copy(loading = false, error = e.message)
            }
        }
    }

    fun backToMesaSelection() {
        uiState = uiState.copy(
            pickingMesa = true,
            currentPedido = null,
            error = null,
        )
    }

    /** Recarga solo la lista de productos (stock actualizado) sin tocar el resto del estado. */
    fun reloadProductos() {
        viewModelScope.launch {
            runCatching {
                val prods = service().listarProductos()
                uiState = uiState.copy(productos = prods)
            }
            // Silencioso: no muestra error en UI si falla el refresco en segundo plano
        }
    }

    fun clearError() {
        uiState = uiState.copy(error = null)
    }

    companion object {
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return TakeOrderViewModel() as T
            }
        }
    }
}

fun formatMoney(value: Double?): String {
    if (value == null) return "—"
    return String.format(Locale.getDefault(), "%.2f", value)
}
