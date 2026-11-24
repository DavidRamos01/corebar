package com.example.corebar.ui.screens

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DinnerDining
import androidx.compose.material.icons.rounded.HourglassTop
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.RoomService
import androidx.compose.material.icons.rounded.Whatshot
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.corebar.data.remote.dto.DetallePedidoDto
import com.example.corebar.data.remote.dto.PedidoDto
import com.example.corebar.ui.components.IosCardSurface
import com.example.corebar.ui.theme.MonoBg
import com.example.corebar.ui.theme.MonoInk
import com.example.corebar.ui.theme.MonoGreen
import com.example.corebar.ui.theme.MonoText
import com.example.corebar.ui.theme.MonoAmber
import com.example.corebar.ui.theme.MonoRed
import com.example.corebar.ui.theme.MonoSub
import com.example.corebar.ui.theme.MonoBorder

// Colores de estado
private data class EstadoDisplay(val tint: Color, val icon: ImageVector, val label: String)

private fun estadoDisplay(estado: String): EstadoDisplay = when (estado) {
    "RECIBIDO"    -> EstadoDisplay(MonoRed,    Icons.Rounded.HourglassTop, "Recibido")
    "PREPARACION" -> EstadoDisplay(MonoAmber, Icons.Rounded.Whatshot,     "Preparando")
    "LISTO"       -> EstadoDisplay(MonoGreen,  Icons.Rounded.CheckCircle,  "Listo")
    "SERVIDO"     -> EstadoDisplay(MonoInk,   Icons.Rounded.DinnerDining, "Servido")
    else          -> EstadoDisplay(MonoSub, Icons.Rounded.HourglassTop, estado)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KitchenStatusScreen(
    vm: KitchenStatusViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state = vm.uiState

    val livePulse = rememberInfiniteTransition(label = "live_dot")
    val dotAlpha by livePulse.animateFloat(
        initialValue = 0.35f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse),
        label = "dot_alpha",
    )

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .graphicsLayer(alpha = dotAlpha)
                                .background(MonoGreen, CircleShape),
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Estado cocina", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = MonoText)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver", tint = MonoInk)
                    }
                },
                actions = {
                    IconButton(onClick = vm::refresh) {
                        Icon(Icons.Rounded.Refresh, "Actualizar", tint = MonoInk)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = MonoBg),
            )
        },
        containerColor = MonoBg,
        modifier = modifier,
    ) { inner ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MonoBg)
                .padding(inner),
        ) {
            when {
                state.loading && state.pedidos.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = MonoInk, modifier = Modifier.size(40.dp), strokeWidth = 3.dp)
                            Spacer(Modifier.height(12.dp))
                            Text("Cargando pedidos…", color = MonoSub)
                        }
                    }
                }

                state.error != null && state.pedidos.isEmpty() -> {
                    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                        Text(state.error, color = MonoRed, textAlign = TextAlign.Center)
                    }
                }

                state.pedidos.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(88.dp)
                                    .background(MonoGreen.copy(alpha = 0.12f), CircleShape),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Rounded.CheckCircle, null, Modifier.size(46.dp), MonoGreen)
                            }
                            Spacer(Modifier.height(16.dp))
                            Text("No hay pedidos activos", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = MonoText)
                            Spacer(Modifier.height(4.dp))
                            Text("Se actualiza automáticamente", fontSize = 14.sp, color = MonoSub)
                        }
                    }
                }

                else -> {
                    val totalListo = state.pedidos.sumOf { p -> p.detalles.orEmpty().count { it.estado == "LISTO" } }

                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        if (totalListo > 0) {
                            item {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(MonoGreen.copy(alpha = 0.12f))
                                        .padding(horizontal = 16.dp, vertical = 14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Box(
                                        modifier = Modifier.size(40.dp).background(MonoGreen, CircleShape),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Icon(Icons.Rounded.DinnerDining, null, tint = Color.White, modifier = Modifier.size(22.dp))
                                    }
                                    Spacer(Modifier.width(12.dp))
                                    Column(Modifier.weight(1f)) {
                                        Text(
                                            "$totalListo plato${if (totalListo != 1) "s" else ""} listo${if (totalListo != 1) "s" else ""}",
                                            fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = MonoGreen,
                                        )
                                        Text("Listos para recoger", fontSize = 13.sp, color = MonoGreen.copy(alpha = 0.7f))
                                    }
                                    Box(
                                        modifier = Modifier.size(10.dp).graphicsLayer(alpha = dotAlpha).background(MonoGreen, CircleShape),
                                    )
                                }
                            }
                        }

                        items(state.pedidos) { pedido ->
                            PedidoStatusCard(
                                pedido = pedido,
                                onMarkServido = { idDetalle -> vm.markAsServido(pedido.idPedido!!, idDetalle) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PedidoStatusCard(pedido: PedidoDto, onMarkServido: (Int) -> Unit) {
    val lineas = pedido.detalles.orEmpty()
    val listoCount = lineas.count { it.estado == "LISTO" }
    val totalCount = lineas.size
    val allListo = totalCount > 0 && listoCount == totalCount

    IosCardSurface(Modifier.fillMaxWidth()) {
        Column {
            // Cabecera
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(9.dp))
                            .background(if (allListo) MonoGreen else MonoInk),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            if (allListo) Icons.Rounded.CheckCircle else Icons.Rounded.DinnerDining,
                            null, tint = Color.White, modifier = Modifier.size(21.dp),
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(
                            "Mesa ${pedido.numeroMesa ?: pedido.idMesa}",
                            fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = MonoText,
                        )
                        if (!pedido.nombreUsuario.isNullOrBlank()) {
                            Text(pedido.nombreUsuario, fontSize = 13.sp, color = MonoSub)
                        }
                    }
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(99.dp))
                        .background(if (allListo) MonoGreen.copy(alpha = 0.15f) else MonoSub.copy(alpha = 0.12f))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                ) {
                    Text(
                        "$listoCount/$totalCount",
                        fontSize = 13.sp, fontWeight = FontWeight.Bold,
                        color = if (allListo) MonoGreen else MonoSub,
                    )
                }
            }

            HorizontalDivider(color = MonoBorder, thickness = 0.5.dp, modifier = Modifier.padding(start = 16.dp))

            lineas.forEachIndexed { idx, linea ->
                LineaStatusRow(linea = linea, onMarkServido = { onMarkServido(linea.idDetalle!!) })
                if (idx < lineas.lastIndex) {
                    HorizontalDivider(color = MonoBorder, thickness = 0.5.dp, modifier = Modifier.padding(start = 16.dp))
                }
            }
        }
    }
}

@Composable
private fun LineaStatusRow(linea: DetallePedidoDto, onMarkServido: () -> Unit) {
    val estado = linea.estado ?: "RECIBIDO"
    val display = estadoDisplay(estado)
    val isListo = estado == "LISTO"

    Column(Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                // qty badge
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(display.tint.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("${linea.cantidad}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = display.tint)
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(linea.nombreProducto ?: "—", fontSize = 16.sp, fontWeight = FontWeight.Normal, color = MonoText)
                    if (!linea.notas.isNullOrBlank()) {
                        Text(linea.notas, fontSize = 13.sp, color = MonoSub, fontStyle = FontStyle.Italic)
                    }
                }
            }

            Spacer(Modifier.width(8.dp))

            // status pill
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(99.dp))
                    .background(display.tint.copy(alpha = 0.12f))
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(display.icon, null, tint = display.tint, modifier = Modifier.size(13.dp))
                Spacer(Modifier.width(4.dp))
                Text(display.label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = display.tint)
            }
        }

        if (isListo && linea.idDetalle != null) {
            Box(modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 12.dp)) {
                com.example.corebar.ui.components.IosFilledButton(
                    text = "Entregar",
                    onClick = onMarkServido,
                    color = MonoGreen,
                    leadingIcon = Icons.Rounded.RoomService,
                    modifier = Modifier.height(40.dp),
                )
            }
        }
    }
}
