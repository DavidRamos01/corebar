package com.example.corebar.ui.screens

import android.app.Application
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CenterFocusStrong
import androidx.compose.material.icons.rounded.Chair
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.DragIndicator
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.LocalBar
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.RestartAlt
import androidx.compose.material.icons.rounded.TableRestaurant
import androidx.compose.material.icons.rounded.TouchApp
import androidx.compose.material.icons.rounded.ZoomIn
import androidx.compose.material.icons.rounded.ZoomOut
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import com.example.corebar.R
import com.example.corebar.data.remote.dto.MesaDto
import com.example.corebar.ui.components.IosFilledButton
import com.example.corebar.ui.theme.MonoBg
import com.example.corebar.ui.theme.MonoInk
import com.example.corebar.ui.theme.MonoCard
import com.example.corebar.ui.theme.MonoSubLight
import com.example.corebar.ui.theme.MonoFill
import com.example.corebar.ui.theme.MonoText
import com.example.corebar.ui.theme.MonoRed
import com.example.corebar.ui.theme.MonoSub

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TableMapScreen(
    currentUserId: Int,
    onBack: () -> Unit,
    onOpenTakeOrderForMesa: (mesaId: Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val app = LocalContext.current.applicationContext as Application
    val vm: TableMapViewModel = viewModel(factory = TableMapViewModel.factory(app))
    val state = vm.uiState
    var scale by remember { mutableFloatStateOf(1f) }
    var pan by remember { mutableStateOf(Offset.Zero) }
    var mesaCapEditId by remember { mutableStateOf<Int?>(null) }
    var lockedMesaNumero by remember { mutableStateOf<Int?>(null) }
    val density = LocalDensity.current.density

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MonoBg,
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(stringResource(R.string.table_map_title), fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = MonoText) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.cd_back), tint = MonoInk)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = MonoBg),
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                state.loading && state.mesasApi.isEmpty() && state.error == null -> {
                    Column(
                        Modifier.fillMaxSize().padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        CircularProgressIndicator(strokeWidth = 3.dp, color = MonoInk)
                        Spacer(Modifier.height(16.dp))
                        Text(stringResource(R.string.table_map_loading), fontSize = 16.sp, color = MonoSub)
                    }
                }

                state.error != null && state.mesasApi.isEmpty() -> {
                    Column(
                        Modifier.fillMaxSize().padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Box(
                            Modifier.size(64.dp).background(MonoRed.copy(alpha = 0.1f), CircleShape),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Rounded.ErrorOutline, null, tint = MonoRed, modifier = Modifier.size(32.dp))
                        }
                        Spacer(Modifier.height(16.dp))
                        Text(state.error.orEmpty(), fontSize = 14.sp, color = MonoSub)
                        Spacer(Modifier.height(20.dp))
                        IosFilledButton(
                            text = stringResource(R.string.take_order_retry),
                            leadingIcon = Icons.Rounded.Refresh,
                            onClick = { vm.reload() },
                            modifier = Modifier.width(220.dp),
                        )
                    }
                }

                else -> {
                    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 8.dp)) {
                        state.error?.let { err ->
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MonoRed.copy(alpha = 0.1f))
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(err, modifier = Modifier.weight(1f), fontSize = 14.sp, color = MonoRed)
                                TextButton(onClick = { vm.clearError() }) {
                                    Text(stringResource(R.string.take_order_dismiss_error), color = MonoInk)
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                        }

                        // Toolbar
                        val toolbarScroll = rememberScrollState()
                        Row(
                            Modifier.fillMaxWidth().horizontalScroll(toolbarScroll).padding(bottom = 10.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            MapToolbarButton({ scale = (scale / 1.18f).coerceIn(0.35f, 5f) }, stringResource(R.string.cd_zoom_out)) {
                                Icon(Icons.Rounded.ZoomOut, null, tint = MonoInk, modifier = Modifier.size(20.dp))
                            }
                            MapToolbarButton({ scale = (scale * 1.18f).coerceIn(0.35f, 5f) }, stringResource(R.string.cd_zoom_in)) {
                                Icon(Icons.Rounded.ZoomIn, null, tint = MonoInk, modifier = Modifier.size(20.dp))
                            }
                            MapToolbarButton({ scale = 1f; pan = Offset.Zero }, stringResource(R.string.cd_table_map_fit_view)) {
                                Icon(Icons.Rounded.CenterFocusStrong, null, tint = MonoInk, modifier = Modifier.size(20.dp))
                            }
                            MapToolbarButton({ vm.resetLandmarksToDefaults() }, stringResource(R.string.cd_table_map_reset_refs)) {
                                Icon(Icons.Rounded.RestartAlt, null, tint = MonoSub, modifier = Modifier.size(20.dp))
                            }
                            Spacer(Modifier.width(2.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Rounded.TouchApp, null, tint = MonoSubLight, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(stringResource(R.string.table_map_hint_short), fontSize = 12.sp, color = MonoSubLight, maxLines = 1)
                            }
                        }

                        // Palette
                        val palette = vm.paletteMesas()
                        if (palette.isEmpty()) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
                                Icon(Icons.Rounded.TableRestaurant, null, tint = MonoSubLight, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    if (state.mesasApi.isEmpty()) stringResource(R.string.table_map_empty_api_mesas_short)
                                    else stringResource(R.string.table_map_all_placed_short),
                                    fontSize = 13.sp, color = MonoSub,
                                )
                            }
                        } else {
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp),
                            ) {
                                items(palette, key = { it.idMesa ?: it.hashCode() }) { mesa ->
                                    PaletteMesaChip(mesa = mesa, onTap = { mesa.idMesa?.let(vm::placeMesaFromPalette) })
                                }
                            }
                        }

                        // Canvas
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .weight(1f)
                                .clip(RoundedCornerShape(18.dp))
                                .background(MonoFill)
                                .pointerInput(Unit) {
                                    detectTransformGestures { _, panChange, zoom, _ ->
                                        scale = (scale * zoom).coerceIn(0.35f, 5f)
                                        pan += panChange
                                    }
                                },
                            contentAlignment = Alignment.Center,
                        ) {
                            Box(
                                Modifier
                                    .graphicsLayer(scaleX = scale, scaleY = scale, translationX = pan.x, translationY = pan.y)
                                    .width(state.salonWidthDp.dp)
                                    .height(state.salonHeightDp.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(MonoCard)
                                    .border(2.dp, MonoInk.copy(alpha = 0.3f), RoundedCornerShape(14.dp)),
                            ) {
                                LandmarkBar(
                                    xDp = state.barraXDp, yDp = state.barraYDp,
                                    widthDp = state.barraWidthDp, heightDp = state.barraHeightDp,
                                    scale = scale, density = density,
                                    resizeCornerLabel = stringResource(R.string.cd_table_map_resize_bar),
                                    onDragDelta = vm::moveBarra, onResizeDelta = vm::resizeBarra,
                                    onDragEnd = { vm.persistLayoutNow() },
                                )
                                LandmarkEntrada(
                                    xDp = state.entradaXDp, yDp = state.entradaYDp,
                                    scale = scale, density = density,
                                    onDragDelta = vm::moveEntrada, onDragEnd = { vm.persistLayoutNow() },
                                )
                                state.placedMesas.forEach { mesa ->
                                    val locked = mesa.isLockedForWaiter(currentUserId)
                                    PlacedMesaMark(
                                        mesa = mesa, scale = scale, density = density, locked = locked,
                                        onOpenOrder = {
                                            if (locked) lockedMesaNumero = mesa.numero ?: mesa.idMesa
                                            else onOpenTakeOrderForMesa(mesa.idMesa)
                                        },
                                        onEditCapacidad = { mesaCapEditId = mesa.idMesa },
                                        onRemove = { vm.removePlacedMesa(mesa.idMesa) },
                                        onDragDelta = { dxDp, dyDp -> vm.moveMesa(mesa.idMesa, dxDp, dyDp) },
                                        onDragEnd = { vm.persistLayoutNow() },
                                    )
                                }
                                SalonResizeCorner(
                                    scale = scale, density = density,
                                    resizeLabel = stringResource(R.string.cd_table_map_resize_salon),
                                    onResize = vm::resizeSalon, onEnd = { vm.persistLayoutNow() },
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Dialog: editar capacidad
    val mesaCapEditor = mesaCapEditId?.let { id -> state.placedMesas.firstOrNull { it.idMesa == id } }
    if (mesaCapEditor != null) {
        val m = mesaCapEditor
        var sliderCap by remember(m.idMesa) { mutableFloatStateOf(m.capacidad.toFloat()) }
        LaunchedEffect(m.idMesa, m.capacidad) { sliderCap = m.capacidad.toFloat() }
        val savingThis = state.savingCapacidadMesaId == m.idMesa
        AlertDialog(
            onDismissRequest = { if (!savingThis) mesaCapEditId = null },
            containerColor = MonoCard,
            icon = {
                Box(
                    Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(MonoInk),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.Chair, null, tint = Color.White, modifier = Modifier.size(26.dp))
                }
            },
            title = {
                Text(stringResource(R.string.table_map_edit_capacity_title, m.numero ?: m.idMesa), fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = MonoText)
            },
            text = {
                Column {
                    if (savingThis) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = MonoInk)
                            Spacer(Modifier.width(12.dp))
                            Text(stringResource(R.string.table_map_saving_capacity), fontSize = 13.sp, color = MonoSub)
                        }
                    }
                    Text(stringResource(R.string.table_map_capacity_bd_value, m.capacidadApi), fontSize = 13.sp, color = MonoSub)
                    Spacer(Modifier.height(8.dp))
                    Text("${sliderCap.toInt()}", fontSize = 30.sp, fontWeight = FontWeight.Bold, color = MonoInk)
                    Slider(
                        value = sliderCap,
                        onValueChange = { if (!savingThis) sliderCap = it },
                        enabled = !savingThis,
                        valueRange = 1f..TableMapViewModel.MaxCapacidadMapa.toFloat(),
                        steps = TableMapViewModel.MaxCapacidadMapa - 2,
                    )
                    TextButton(
                        enabled = !savingThis,
                        onClick = { vm.sincronizarCapacidadMesaDesdeServidor(m.idMesa) { err -> if (err == null) mesaCapEditId = null } },
                    ) {
                        Text(stringResource(R.string.table_map_restore_capacity_bd), color = MonoSub)
                    }
                }
            },
            confirmButton = {
                TextButton(
                    enabled = !savingThis,
                    onClick = { vm.updatePlacedMesaCapacidad(m.idMesa, sliderCap.toInt()) { err -> if (err == null) mesaCapEditId = null } },
                ) {
                    Text(stringResource(R.string.table_map_save_capacity), color = MonoInk, fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                TextButton(enabled = !savingThis, onClick = { mesaCapEditId = null }) {
                    Text(stringResource(R.string.take_order_cancel), color = MonoSub)
                }
            },
        )
    }

    // Dialog: mesa bloqueada
    if (lockedMesaNumero != null) {
        AlertDialog(
            onDismissRequest = { lockedMesaNumero = null },
            containerColor = MonoCard,
            icon = {
                Box(
                    Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(MonoSubLight),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.Lock, null, tint = Color.White, modifier = Modifier.size(26.dp))
                }
            },
            title = { Text("Mesa $lockedMesaNumero — ya tiene camarero asignado", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = MonoText) },
            text = { Text("Esta mesa tiene un pedido abierto gestionado por otro camarero. Solo él puede acceder.", fontSize = 15.sp, color = MonoSub) },
            confirmButton = {
                TextButton(onClick = { lockedMesaNumero = null }) {
                    Text("Entendido", color = MonoInk, fontWeight = FontWeight.SemiBold)
                }
            },
        )
    }
}

@Composable
private fun MapToolbarButton(onClick: () -> Unit, contentDescription: String, content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .size(42.dp)
            .clip(CircleShape)
            .background(MonoCard)
            .clickable(onClick = onClick)
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) { content() }
}

@Composable
private fun SalonResizeCorner(
    scale: Float, density: Float, resizeLabel: String,
    onResize: (dxDp: Float, dyDp: Float) -> Unit, onEnd: () -> Unit,
) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomEnd) {
        Box(
            modifier = Modifier
                .padding(8.dp)
                .size(36.dp)
                .clip(CircleShape)
                .background(MonoInk)
                .semantics { contentDescription = resizeLabel }
                .pointerInput(scale, density) {
                    detectDragGestures(
                        onDragEnd = { onEnd() }, onDragCancel = { onEnd() },
                        onDrag = { _, dragAmount -> onResize(dragAmount.x / (scale * density), dragAmount.y / (scale * density)) },
                    )
                },
            contentAlignment = Alignment.Center,
        ) {
            Text("⤡", color = Color.White, fontSize = 18.sp)
        }
    }
}

@Composable
private fun PaletteMesaChip(mesa: MesaDto, onTap: () -> Unit) {
    val num = TableMapViewModel.paletteShortLabel(mesa)
    val cap = TableMapViewModel.capacidadFromDto(mesa)
    Box(
        Modifier
            .clip(RoundedCornerShape(99.dp))
            .background(MonoCard)
            .clickable(onClick = onTap)
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Rounded.TableRestaurant, null, tint = MonoInk, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text(num, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = MonoText)
            Spacer(Modifier.width(8.dp))
            Icon(Icons.Rounded.Chair, contentDescription = stringResource(R.string.cd_mesa_capacity_plazas), modifier = Modifier.size(14.dp), tint = MonoSub)
            Text("$cap", fontSize = 13.sp, color = MonoSub, modifier = Modifier.padding(start = 2.dp))
            Spacer(Modifier.width(6.dp))
            Box(Modifier.size(18.dp).background(MonoInk, CircleShape), contentAlignment = Alignment.Center) {
                Icon(Icons.Rounded.Add, null, tint = Color.White, modifier = Modifier.size(12.dp))
            }
        }
    }
}

@Composable
private fun PlacedMesaMark(
    mesa: PlacedMesaUi, scale: Float, density: Float, locked: Boolean = false,
    onOpenOrder: () -> Unit, onEditCapacidad: () -> Unit, onRemove: () -> Unit,
    onDragDelta: (dxDp: Float, dyDp: Float) -> Unit, onDragEnd: () -> Unit,
) {
    val fullCap = mesa.capacidad.coerceAtLeast(1)
    val iconsShown = fullCap.coerceAtMost(28)
    val orbitR = 56f

    Column(
        Modifier.offset(x = mesa.xDp.dp, y = mesa.yDp.dp).width(188.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .width(30.dp)
                    .pointerInput(scale, density) {
                        detectDragGestures(
                            onDragEnd = { onDragEnd() }, onDragCancel = { onDragEnd() },
                            onDrag = { _, dragAmount -> onDragDelta(dragAmount.x / (scale * density), dragAmount.y / (scale * density)) },
                        )
                    },
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Rounded.DragIndicator, contentDescription = stringResource(R.string.cd_drag_handle), tint = MonoSubLight, modifier = Modifier.size(24.dp))
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onEditCapacidad, enabled = !locked, modifier = Modifier.size(34.dp)) {
                    Icon(
                        Icons.Rounded.Edit,
                        contentDescription = stringResource(R.string.cd_edit_mesa_capacity),
                        tint = when {
                            locked -> MonoSubLight.copy(alpha = 0.4f)
                            mesa.capacidadDistintaDeBd() -> MonoRed
                            else -> MonoInk
                        },
                    )
                }
                IconButton(onClick = onRemove, modifier = Modifier.size(34.dp)) {
                    Icon(Icons.Rounded.Close, contentDescription = stringResource(R.string.cd_remove_from_map), tint = MonoSubLight)
                }
            }
        }
        Box(Modifier.size(184.dp, 172.dp), contentAlignment = Alignment.Center) {
            repeat(iconsShown) { i ->
                val angle = (i * 360f / iconsShown - 90f) * PI.toFloat() / 180f
                val ox = cos(angle) * orbitR
                val oy = sin(angle) * orbitR
                Surface(
                    modifier = Modifier.align(Alignment.Center).offset(x = ox.dp, y = oy.dp).size(22.dp),
                    shape = CircleShape,
                    color = MonoCard,
                    border = BorderStroke(1.5.dp, if (locked) MonoSubLight.copy(alpha = 0.4f) else MonoInk.copy(alpha = 0.4f)),
                    shadowElevation = 1.dp,
                ) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Icon(Icons.Rounded.Chair, contentDescription = stringResource(R.string.cd_chair_seat), modifier = Modifier.size(13.dp), tint = if (locked) MonoSubLight else MonoInk)
                    }
                }
            }
            Box(
                Modifier
                    .size(80.dp, 62.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (locked) MonoFill else MonoInk)
                    .clickable(onClick = onOpenOrder),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    if (locked) {
                        Icon(Icons.Rounded.Lock, contentDescription = "Mesa bloqueada", tint = MonoSubLight, modifier = Modifier.size(22.dp))
                    } else {
                        Icon(Icons.Rounded.TableRestaurant, contentDescription = stringResource(R.string.cd_mesa_icon), tint = Color.White, modifier = Modifier.size(24.dp))
                    }
                    Text("${mesa.numero ?: mesa.idMesa}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = if (locked) MonoSub else Color.White)
                    if (fullCap > iconsShown) {
                        Text("+${fullCap - iconsShown}", fontSize = 11.sp, color = if (locked) MonoRed else Color.White.copy(alpha = 0.85f))
                    }
                }
            }
            Icon(
                if (locked) Icons.Rounded.Lock else Icons.Rounded.TouchApp,
                contentDescription = stringResource(R.string.cd_table_map_tap_table),
                tint = if (locked) MonoSubLight.copy(alpha = 0.5f) else MonoInk.copy(alpha = 0.5f),
                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 2.dp).size(18.dp),
            )
        }
    }
}

@Composable
private fun LandmarkEntrada(
    xDp: Float, yDp: Float, scale: Float, density: Float,
    onDragDelta: (dxDp: Float, dyDp: Float) -> Unit, onDragEnd: () -> Unit,
) {
    Box(Modifier.offset(x = xDp.dp, y = yDp.dp)) {
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = MonoGreenContainer,
            border = BorderStroke(2.dp, com.example.corebar.ui.theme.MonoGreen.copy(alpha = 0.6f)),
            shadowElevation = 3.dp,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(end = 10.dp, top = 6.dp, bottom = 6.dp)) {
                Box(
                    Modifier
                        .width(34.dp)
                        .pointerInput(scale, density) {
                            detectDragGestures(
                                onDragEnd = { onDragEnd() }, onDragCancel = { onDragEnd() },
                                onDrag = { _, dragAmount -> onDragDelta(dragAmount.x / (scale * density), dragAmount.y / (scale * density)) },
                            )
                        },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.DragIndicator, contentDescription = stringResource(R.string.cd_drag_handle), tint = com.example.corebar.ui.theme.MonoGreen, modifier = Modifier.size(24.dp))
                }
                Text("🚪", fontSize = 38.sp, modifier = Modifier.padding(end = 8.dp))
            }
        }
    }
}

private val MonoGreenContainer = Color(0xFFD6F5DD)

@Composable
private fun LandmarkBar(
    xDp: Float, yDp: Float, widthDp: Float, heightDp: Float,
    scale: Float, density: Float, resizeCornerLabel: String,
    onDragDelta: (dxDp: Float, dyDp: Float) -> Unit, onResizeDelta: (dxDp: Float, dyDp: Float) -> Unit, onDragEnd: () -> Unit,
) {
    Box(Modifier.offset(x = xDp.dp, y = yDp.dp).width(widthDp.dp).height(heightDp.dp)) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            shape = RoundedCornerShape(18.dp),
            color = Color(0xFF8D6E63),
            border = BorderStroke(2.dp, Color(0xFFD7CCC8)),
            shadowElevation = 4.dp,
        ) {
            Box(Modifier.fillMaxSize()) {
                Row(
                    Modifier.align(Alignment.CenterStart).fillMaxHeight().padding(start = 6.dp, end = 44.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Box(
                        Modifier
                            .width(32.dp)
                            .fillMaxHeight()
                            .pointerInput(scale, density) {
                                detectDragGestures(
                                    onDragEnd = { onDragEnd() }, onDragCancel = { onDragEnd() },
                                    onDrag = { _, dragAmount -> onDragDelta(dragAmount.x / (scale * density), dragAmount.y / (scale * density)) },
                                )
                            },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.DragIndicator, contentDescription = stringResource(R.string.cd_drag_handle), tint = Color(0xFFEFEBE9), modifier = Modifier.size(24.dp))
                    }
                    Icon(Icons.Rounded.LocalBar, null, tint = Color(0xFFFFE082), modifier = Modifier.size(30.dp))
                    Text("🍺", fontSize = 28.sp)
                }
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(6.dp)
                        .size(34.dp)
                        .clip(CircleShape)
                        .background(MonoInk)
                        .semantics { contentDescription = resizeCornerLabel }
                        .pointerInput(scale, density) {
                            detectDragGestures(
                                onDragEnd = { onDragEnd() }, onDragCancel = { onDragEnd() },
                                onDrag = { _, dragAmount -> onResizeDelta(dragAmount.x / (scale * density), dragAmount.y / (scale * density)) },
                            )
                        },
                    contentAlignment = Alignment.Center,
                ) {
                    Text("⤡", fontSize = 16.sp, color = Color.White)
                }
            }
        }
    }
}
