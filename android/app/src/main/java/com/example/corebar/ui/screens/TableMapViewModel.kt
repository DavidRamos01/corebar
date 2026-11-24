package com.example.corebar.ui.screens

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.corebar.data.local.FloorPlanRepository
import com.example.corebar.data.local.FloorPlanSnapshot
import com.example.corebar.data.local.PlacedMesaPersisted
import com.example.corebar.data.remote.ApiClient
import com.example.corebar.data.remote.CorebarApiService
import com.example.corebar.data.remote.dto.MesaDto
import com.example.corebar.data.remote.dto.MesaRequestBody
import com.example.corebar.data.remote.parseApiError
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class PlacedMesaUi(
    val idMesa: Int,
    val numero: Int?,
    /** Capacidad según BD (actualizada al recargar). */
    val capacidadApi: Int,
    /** Capacidad efectiva en el mapa (override local o igual a API). */
    val capacidad: Int,
    val xDp: Float,
    val yDp: Float,
    /** Id del camarero con pedido abierto en esta mesa. null = libre. */
    val idCamareroActual: Int? = null,
) {
    fun capacidadDistintaDeBd(): Boolean = capacidad != capacidadApi
    /** true si la mesa tiene pedido de OTRO camarero (no del usuario actual). */
    fun isLockedForWaiter(myUserId: Int): Boolean =
        idCamareroActual != null && idCamareroActual != myUserId
}

data class TableMapUiState(
    val mesasApi: List<MesaDto> = emptyList(),
    val placedMesas: List<PlacedMesaUi> = emptyList(),
    val salonWidthDp: Float = 1200f,
    val salonHeightDp: Float = 780f,
    val entradaXDp: Float = 480f,
    val entradaYDp: Float = 28f,
    val barraXDp: Float = 36f,
    val barraYDp: Float = 220f,
    val barraWidthDp: Float = 300f,
    val barraHeightDp: Float = 96f,
    val loading: Boolean = false,
    /** PUT capacidad en curso para esa mesa (null = ninguno). */
    val savingCapacidadMesaId: Int? = null,
    val error: String? = null,
)

class TableMapViewModel(app: Application) : AndroidViewModel(app) {

    private val floorRepo = FloorPlanRepository(app)

    var uiState by mutableStateOf(TableMapUiState())
        private set

    init {
        reload()
    }

    private suspend fun service(): CorebarApiService =
        withContext(Dispatchers.IO) { ApiClient.service }

    fun reload() {
        viewModelScope.launch {
            uiState = uiState.copy(loading = true, error = null)
            runCatching {
                val api = service()
                val mesas = api.listarMesas().filter { it.idMesa != null }
                val saved = floorRepo.load()
                val validIds = mesas.mapNotNull { it.idMesa }.toSet()
                val mergedMesas = saved.mesas
                    .filter { it.idMesa in validIds }
                    .map { p ->
                        val dto = mesas.first { it.idMesa == p.idMesa }
                        val apiCap = capacidadFromDto(dto)
                        val effective = (p.capacidadOverride ?: apiCap).coerceIn(1, MaxCapacidadMapa)
                        PlacedMesaUi(
                            idMesa = p.idMesa,
                            numero = dto.numero,
                            capacidadApi = apiCap,
                            capacidad = effective,
                            xDp = p.xDp,
                            yDp = p.yDp,
                            idCamareroActual = dto.idCamareroActual,
                        )
                    }
                val sw = saved.salonWidthDp ?: DefaultSalonWidth
                val sh = saved.salonHeightDp ?: DefaultSalonHeight
                val ex = saved.entradaX ?: DefaultEntrada.first
                val ey = saved.entradaY ?: DefaultEntrada.second
                val bx = saved.barraX ?: DefaultBarra.first
                val by = saved.barraY ?: DefaultBarra.second
                val bw = saved.barraWidthDp ?: DefaultBarWidth
                val bh = saved.barraHeightDp ?: DefaultBarHeight
                uiState = TableMapUiState(
                    mesasApi = mesas,
                    placedMesas = mergedMesas,
                    salonWidthDp = sw,
                    salonHeightDp = sh,
                    entradaXDp = ex,
                    entradaYDp = ey,
                    barraXDp = bx,
                    barraYDp = by,
                    barraWidthDp = bw,
                    barraHeightDp = bh,
                    loading = false,
                    error = null,
                ).clamped()
                persistSnapshot()
            }.onFailure { e ->
                uiState = uiState.copy(
                    loading = false,
                    error = e.message ?: "Error",
                )
            }
        }
    }

    fun clearError() {
        uiState = uiState.copy(error = null)
    }

    fun paletteMesas(): List<MesaDto> {
        val placed = uiState.placedMesas.map { it.idMesa }.toSet()
        return uiState.mesasApi.filter { it.idMesa != null && it.idMesa !in placed }
    }

    fun placeMesaFromPalette(idMesa: Int) {
        val dto = uiState.mesasApi.firstOrNull { it.idMesa == idMesa } ?: return
        if (uiState.placedMesas.any { it.idMesa == idMesa }) return
        val (x, y) = nextPaletteSlot(uiState.placedMesas.size)
        val apiCap = capacidadFromDto(dto)
        val next = uiState.placedMesas + PlacedMesaUi(
            idMesa = idMesa,
            numero = dto.numero,
            capacidadApi = apiCap,
            capacidad = apiCap,
            xDp = x,
            yDp = y,
            idCamareroActual = dto.idCamareroActual,
        )
        uiState = uiState.copy(placedMesas = next).clamped()
        persistSnapshot()
    }

    fun removePlacedMesa(idMesa: Int) {
        uiState = uiState.copy(placedMesas = uiState.placedMesas.filter { it.idMesa != idMesa })
        persistSnapshot()
    }

    /** Persiste capacidad en el servidor (`PUT /api/mesas/{id}`) y actualiza lista local */
    fun updatePlacedMesaCapacidad(
        idMesa: Int,
        nuevaCapacidad: Int,
        onFinished: (Throwable?) -> Unit,
    ) {
        viewModelScope.launch {
            uiState = uiState.copy(savingCapacidadMesaId = idMesa, error = null)
            val err = runCatching {
                val api = service()
                val current = obtenerMesaDto(api, idMesa)
                val body = mesaRequestBodyParaPut(current, nuevaCapacidad)
                val put = api.actualizarMesa(idMesa, body)
                if (!put.isSuccessful) throw IllegalStateException(parseApiError(put))
                val updated = put.body() ?: throw IllegalStateException("El servidor no devolvió la mesa actualizada.")
                aplicarMesaDesdeServidor(updated)
            }.exceptionOrNull()
            uiState = uiState.copy(
                savingCapacidadMesaId = null,
                error = err?.message?.takeIf { it.isNotBlank() },
            )
            onFinished(err)
        }
    }

    /** Actualiza capacidad mostrada desde `GET /api/mesas/{id}` (sin PUT). */
    fun sincronizarCapacidadMesaDesdeServidor(
        idMesa: Int,
        onFinished: (Throwable?) -> Unit,
    ) {
        viewModelScope.launch {
            uiState = uiState.copy(savingCapacidadMesaId = idMesa, error = null)
            val err = runCatching {
                val api = service()
                val dto = obtenerMesaDto(api, idMesa)
                aplicarMesaDesdeServidor(dto)
            }.exceptionOrNull()
            uiState = uiState.copy(
                savingCapacidadMesaId = null,
                error = err?.message?.takeIf { it.isNotBlank() },
            )
            onFinished(err)
        }
    }

    private suspend fun obtenerMesaDto(api: CorebarApiService, idMesa: Int): MesaDto {
        val r = api.obtenerMesa(idMesa)
        if (!r.isSuccessful) throw IllegalStateException(parseApiError(r))
        return r.body() ?: throw IllegalStateException("Respuesta sin datos de mesa.")
    }

    private fun mesaRequestBodyParaPut(current: MesaDto, nuevaCapacidad: Int): MesaRequestBody {
        val numero = current.numero ?: throw IllegalStateException("La mesa no tiene número en el servidor.")
        val cap = nuevaCapacidad.coerceIn(1, MaxCapacidadMapa)
        return MesaRequestBody(
            numero = numero,
            capacidad = cap,
            estado = current.estado,
            posX = current.posX,
            posY = current.posY,
        )
    }

    private fun aplicarMesaDesdeServidor(updated: MesaDto) {
        val id = updated.idMesa ?: return
        val cap = capacidadFromDto(updated)
        uiState = uiState.copy(
            mesasApi = uiState.mesasApi.map { if (it.idMesa == id) updated else it },
            placedMesas = uiState.placedMesas.map {
                if (it.idMesa == id) {
                    it.copy(
                        numero = updated.numero,
                        capacidadApi = cap,
                        capacidad = cap,
                        idCamareroActual = updated.idCamareroActual,
                    )
                } else {
                    it
                }
            },
        )
        persistSnapshot()
    }

    fun moveMesa(idMesa: Int, dxDp: Float, dyDp: Float) {
        uiState = uiState.copy(
            placedMesas = uiState.placedMesas.map {
                if (it.idMesa == idMesa) {
                    it.copy(xDp = clampXDp(it.xDp + dxDp), yDp = clampYDp(it.yDp + dyDp))
                } else {
                    it
                }
            },
        )
    }

    fun moveEntrada(dxDp: Float, dyDp: Float) {
        uiState = uiState.copy(
            entradaXDp = clampXDp(uiState.entradaXDp + dxDp),
            entradaYDp = clampYDp(uiState.entradaYDp + dyDp),
        )
    }

    fun moveBarra(dxDp: Float, dyDp: Float) {
        uiState = uiState.copy(
            barraXDp = uiState.barraXDp + dxDp,
            barraYDp = uiState.barraYDp + dyDp,
        ).clamped()
    }

    fun resizeBarra(dwDp: Float, dhDp: Float) {
        uiState = uiState.copy(
            barraWidthDp = uiState.barraWidthDp + dwDp,
            barraHeightDp = uiState.barraHeightDp + dhDp,
        ).clamped()
    }

    fun resizeSalon(dwDp: Float, dhDp: Float) {
        uiState = uiState.copy(
            salonWidthDp = uiState.salonWidthDp + dwDp,
            salonHeightDp = uiState.salonHeightDp + dhDp,
        ).clamped()
        persistSnapshot()
    }

    fun resetLandmarksToDefaults() {
        uiState = uiState.copy(
            entradaXDp = DefaultEntrada.first,
            entradaYDp = DefaultEntrada.second,
            barraXDp = DefaultBarra.first,
            barraYDp = DefaultBarra.second,
            barraWidthDp = DefaultBarWidth,
            barraHeightDp = DefaultBarHeight,
        ).clamped()
        persistSnapshot()
    }

    fun persistLayoutNow() {
        persistSnapshot()
    }

    private fun persistSnapshot() {
        val s = uiState.clamped()
        if (s != uiState) uiState = s
        val snap = FloorPlanSnapshot(
            mesas = s.placedMesas.map { m ->
                val override = if (m.capacidad == m.capacidadApi) null else m.capacidad
                PlacedMesaPersisted(m.idMesa, m.xDp, m.yDp, capacidadOverride = override)
            },
            salonWidthDp = s.salonWidthDp,
            salonHeightDp = s.salonHeightDp,
            entradaX = s.entradaXDp,
            entradaY = s.entradaYDp,
            barraX = s.barraXDp,
            barraY = s.barraYDp,
            barraWidthDp = s.barraWidthDp,
            barraHeightDp = s.barraHeightDp,
        )
        floorRepo.save(snap)
    }

    private fun clampXDp(v: Float): Float = v.coerceIn(0f, maxXDp())
    private fun clampYDp(v: Float): Float = v.coerceIn(0f, maxYDp())

    private fun maxXDp(): Float = (uiState.salonWidthDp - MarginDp).coerceAtLeast(MinSalonWidth * 0.25f)
    private fun maxYDp(): Float = (uiState.salonHeightDp - MarginDp).coerceAtLeast(MinSalonHeight * 0.25f)

    private fun TableMapUiState.clamped(): TableMapUiState {
        val sw = salonWidthDp.coerceIn(MinSalonWidth, MaxSalonWidth)
        val sh = salonHeightDp.coerceIn(MinSalonHeight, MaxSalonHeight)
        val bw0 = barraWidthDp.coerceIn(MinBarWidth, sw - MarginDp)
        val bh0 = barraHeightDp.coerceIn(MinBarHeight, sh - MarginDp)
        var bx = barraXDp.coerceIn(0f, (sw - bw0).coerceAtLeast(0f))
        var by = barraYDp.coerceIn(0f, (sh - bh0).coerceAtLeast(0f))
        var bw = bw0.coerceIn(MinBarWidth, sw - bx)
        var bh = bh0.coerceIn(MinBarHeight, sh - by)
        bx = bx.coerceIn(0f, (sw - bw).coerceAtLeast(0f))
        by = by.coerceIn(0f, (sh - bh).coerceAtLeast(0f))

        val mx = (sw - MarginDp).coerceAtLeast(0f)
        val my = (sh - MarginDp).coerceAtLeast(0f)

        return copy(
            salonWidthDp = sw,
            salonHeightDp = sh,
            barraXDp = bx,
            barraYDp = by,
            barraWidthDp = bw,
            barraHeightDp = bh,
            placedMesas = placedMesas.map {
                it.copy(xDp = it.xDp.coerceIn(0f, mx), yDp = it.yDp.coerceIn(0f, my))
            },
            entradaXDp = entradaXDp.coerceIn(0f, mx),
            entradaYDp = entradaYDp.coerceIn(0f, my),
        )
    }

    companion object {
        const val DefaultSalonWidth = 1200f
        const val DefaultSalonHeight = 780f
        const val MaxCapacidadMapa = 48
        val DefaultEntrada: Pair<Float, Float> = 480f to 28f
        val DefaultBarra: Pair<Float, Float> = 36f to 220f
        const val DefaultBarWidth = 300f
        const val DefaultBarHeight = 96f

        private const val MinSalonWidth = 520f
        private const val MinSalonHeight = 380f
        private const val MaxSalonWidth = 2200f
        private const val MaxSalonHeight = 1400f
        private const val MarginDp = 16f
        private const val MinBarWidth = 96f
        private const val MinBarHeight = 56f

        fun capacidadFromDto(dto: MesaDto): Int =
            dto.capacidad?.takeIf { it >= 1 } ?: 4

        fun paletteShortLabel(dto: MesaDto): String =
            "${dto.numero ?: dto.idMesa}"

        fun nextPaletteSlot(index: Int): Pair<Float, Float> {
            val col = index % 5
            val row = index / 5
            val x = 72f + col * 132f
            val y = 72f + row * 104f
            return x to y
        }

        fun factory(app: Application): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                TableMapViewModel(app) as T
        }
    }
}
