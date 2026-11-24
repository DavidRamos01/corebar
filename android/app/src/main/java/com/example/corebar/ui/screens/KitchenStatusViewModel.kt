package com.example.corebar.ui.screens

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.corebar.data.remote.ApiClient
import com.example.corebar.data.remote.dto.EstadoLineaBody
import com.example.corebar.data.remote.dto.PedidoDto
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

data class KitchenStatusUiState(
    val pedidos: List<PedidoDto> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    /** Platos que acaban de quedar LISTO, (mesa, nombrePlato). Alimenta el toast global. */
    val newReadyLines: List<Pair<String, String>> = emptyList(),
)

class KitchenStatusViewModel(app: Application) : AndroidViewModel(app) {

    var uiState by mutableStateOf(KitchenStatusUiState())
        private set

    /** idDetalle -> último estado conocido (para detectar transiciones a LISTO) */
    private val prevLineStates = mutableMapOf<Int, String>()
    private var pollingJob: Job? = null
    private var currentUserId   = -1

    // Ciclo de vida

    /** Inicia (o reinicia) el polling. Llamar tras login. */
    fun startFor(userId: Int) {
        if (userId == currentUserId && pollingJob?.isActive == true) return
        currentUserId = userId
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (true) {
                fetchOrders()
                delay(8_000L)
            }
        }
    }

    /** Para el polling y limpia el estado. Llamar en logout. */
    fun stop() {
        pollingJob?.cancel()
        pollingJob      = null
        currentUserId   = -1
        prevLineStates.clear()
        uiState = KitchenStatusUiState()
    }

    // Acciones

    fun refresh() {
        viewModelScope.launch { fetchOrders() }
    }

    fun clearReadyBanner() {
        uiState = uiState.copy(newReadyLines = emptyList())
    }

    /** Marca una línea como SERVIDO y refresca la lista. */
    fun markAsServido(idPedido: Int, idDetalle: Int) {
        viewModelScope.launch {
            try {
                ApiClient.service.cambiarEstadoLinea(
                    idPedido  = idPedido,
                    idDetalle = idDetalle,
                    body      = EstadoLineaBody("SERVIDO"),
                )
                fetchOrders()
            } catch (e: Exception) {
                uiState = uiState.copy(error = e.message ?: "Error al marcar servido")
            }
        }
    }

    // Interno

    private suspend fun fetchOrders() {
        val userId = currentUserId.takeIf { it > 0 } ?: return
        try {
            val nuevos = ApiClient.service.pedidosCamarero(userId)

            // Detectar líneas que acaban de pasar a LISTO
            val justReady = mutableListOf<Pair<String, String>>()
            for (pedido in nuevos) {
                val mesa = "Mesa ${pedido.numeroMesa ?: pedido.idMesa}"
                for (linea in pedido.detalles.orEmpty()) {
                    val id            = linea.idDetalle ?: continue
                    val estadoAnterior = prevLineStates[id]
                    val estadoNuevo   = linea.estado ?: "RECIBIDO"
                    if (estadoNuevo == "LISTO"
                        && estadoAnterior != null
                        && estadoAnterior != "LISTO"
                        && estadoAnterior != "SERVIDO"
                    ) {
                        justReady.add(mesa to (linea.nombreProducto ?: "Plato"))
                    }
                    prevLineStates[id] = estadoNuevo
                }
            }

            // Limpiar estados de líneas que ya no existen
            val activeIds = nuevos
                .flatMap { it.detalles.orEmpty() }
                .mapNotNull { it.idDetalle }
                .toSet()
            prevLineStates.keys.retainAll(activeIds)

            uiState = uiState.copy(
                pedidos      = nuevos,
                loading      = false,
                error        = null,
                newReadyLines = if (justReady.isNotEmpty()) justReady else uiState.newReadyLines,
            )
        } catch (e: Exception) {
            uiState = uiState.copy(loading = false, error = e.message ?: "Error al cargar")
        }
    }

    companion object {
        fun factoryFor(app: Application): ViewModelProvider.Factory =
            object : ViewModelProvider.AndroidViewModelFactory(app) {}
    }
}
