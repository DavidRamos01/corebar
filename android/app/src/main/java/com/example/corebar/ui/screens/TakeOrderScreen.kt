package com.example.corebar.ui.screens

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CardGiftcard
import androidx.compose.material.icons.rounded.CreditCard
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Done
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material.icons.rounded.PhoneAndroid
import androidx.compose.material.icons.rounded.ReceiptLong
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.RestaurantMenu
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.TableRestaurant
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.SubcomposeAsyncImage
import coil.request.ImageRequest
import kotlinx.coroutines.delay
import com.example.corebar.R
import com.example.corebar.data.remote.dto.DetallePedidoDto
import com.example.corebar.data.remote.dto.ProductoDto
import com.example.corebar.ui.components.IosCardSurface
import com.example.corebar.ui.components.IosFilledButton
import com.example.corebar.ui.components.IosSectionHeader
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
fun TakeOrderScreen(
    onBack: () -> Unit,
    initialMesaIdFromMap: Int? = null,
    modifier: Modifier = Modifier,
    vm: TakeOrderViewModel = viewModel(factory = TakeOrderViewModel.Factory),
) {
    val state = vm.uiState

    LaunchedEffect(initialMesaIdFromMap, state.mesas, state.loading) {
        val id = initialMesaIdFromMap ?: return@LaunchedEffect
        if (id <= 0) return@LaunchedEffect
        if (state.loading && state.mesas.isEmpty()) return@LaunchedEffect
        if (state.mesas.isEmpty()) return@LaunchedEffect
        vm.tryConsumeInitialMesaFromMap(id)
    }

    LaunchedEffect(state.pickingMesa) {
        if (!state.pickingMesa) {
            while (true) {
                delay(10_000L)
                vm.reloadProductos()
            }
        }
    }

    var productDraft by remember { mutableStateOf<ProductoDto?>(null) }
    var qtyText by remember { mutableStateOf("1") }
    var notesText by remember { mutableStateOf("") }
    var searchQuery by remember { mutableStateOf("") }
    var showPaymentDialog by remember { mutableStateOf(false) }
    var selectedMetodoPago by remember { mutableStateOf("EFECTIVO") }

    LaunchedEffect(state.pedidoFinalizado) {
        if (state.pedidoFinalizado) onBack()
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MonoBg,
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(stringResource(R.string.take_order_title), fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = MonoText) },
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
            val bootstrapFailed = state.mesas.isEmpty() && state.error != null && !state.loading

            when {
                state.loading && state.mesas.isEmpty() && state.error == null -> {
                    Column(
                        Modifier.fillMaxSize().padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(40.dp), strokeWidth = 3.dp, color = MonoInk)
                        Spacer(Modifier.height(16.dp))
                        Text(stringResource(R.string.take_order_loading), fontSize = 16.sp, color = MonoSub)
                        Spacer(Modifier.height(12.dp))
                        LinearProgressIndicator(
                            modifier = Modifier.widthIn(max = 280.dp).fillMaxWidth(0.65f).height(3.dp),
                            color = MonoInk,
                            trackColor = MonoFill,
                        )
                    }
                }
                bootstrapFailed -> {
                    ErrorPanel(
                        message = when (state.error.orEmpty()) {
                            "NO_WAITER" -> stringResource(R.string.take_order_error_no_waiter)
                            "NO_SESSION" -> stringResource(R.string.take_order_error_no_session)
                            else -> state.error.orEmpty().ifBlank { stringResource(R.string.take_order_error_generic) }
                        },
                        onRetry = { vm.reloadInitial() },
                    )
                }
                else -> {
                    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 8.dp)) {
                        state.error?.let { err ->
                            val human = when (err) {
                                "NO_WAITER" -> stringResource(R.string.take_order_error_no_waiter)
                                "NO_SESSION" -> stringResource(R.string.take_order_error_no_session)
                                else -> err.ifBlank { stringResource(R.string.take_order_error_generic) }
                            }
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MonoRed.copy(alpha = 0.1f))
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(Icons.Rounded.ErrorOutline, null, tint = MonoRed, modifier = Modifier.size(20.dp))
                                Text(human, modifier = Modifier.weight(1f).padding(horizontal = 10.dp), color = MonoRed, fontSize = 14.sp)
                                TextButton(onClick = { vm.clearError() }) {
                                    Text(stringResource(R.string.take_order_dismiss_error), color = MonoInk)
                                }
                            }
                            Spacer(Modifier.height(12.dp))
                        }

                        if (state.pickingMesa) {
                            IosSectionHeader(stringResource(R.string.take_order_step_mesas))
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp),
                            ) {
                                items(state.mesas, key = { it.idMesa ?: it.hashCode() }) { mesa ->
                                    MesaChip(
                                        label = "Mesa ${mesa.numero ?: mesa.idMesa}",
                                        selected = mesa.idMesa == state.selectedMesaId,
                                        onClick = { vm.clearError(); vm.selectMesa(mesa.idMesa) },
                                    )
                                }
                            }
                            if (state.mesas.isEmpty() && !state.loading) {
                                Spacer(Modifier.height(12.dp))
                                if (state.allTablesOccupied) {
                                    EmptyCatalogHint(
                                        title = stringResource(R.string.take_order_all_occupied_title),
                                        body = stringResource(R.string.take_order_all_occupied_body),
                                        onRefresh = { vm.reloadInitial() },
                                    )
                                } else {
                                    EmptyCatalogHint(
                                        title = stringResource(R.string.take_order_empty_mesas_title),
                                        body = stringResource(R.string.take_order_empty_mesas_body),
                                        onRefresh = { vm.reloadInitial() },
                                    )
                                }
                            }
                            Spacer(Modifier.height(20.dp))
                            IosFilledButton(
                                text = if (state.loading) stringResource(R.string.take_order_loading) else stringResource(R.string.take_order_open_order),
                                loading = state.loading,
                                enabled = !state.loading && state.selectedMesaId != null && state.mesas.isNotEmpty(),
                                onClick = { vm.openOrContinuePedido() },
                            )
                        } else {
                            val pedido = state.currentPedido
                            if (pedido == null) {
                                Text(stringResource(R.string.take_order_error_generic), color = MonoSub)
                            } else {
                                // Resumen del pedido
                                IosCardSurface(Modifier.fillMaxWidth()) {
                                    Row(
                                        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                    ) {
                                        Column(Modifier.weight(1f)) {
                                            Text(
                                                stringResource(R.string.take_order_total, formatMoney(pedido.total)),
                                                fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MonoText,
                                            )
                                            Text(
                                                "Pedido #${pedido.idPedido} · Mesa ${pedido.numeroMesa ?: pedido.idMesa}",
                                                fontSize = 13.sp, color = MonoSub,
                                            )
                                        }
                                        Box(
                                            Modifier
                                                .clip(RoundedCornerShape(99.dp))
                                                .background(MonoInk.copy(alpha = 0.12f))
                                                .clickable { vm.backToMesaSelection() }
                                                .padding(horizontal = 14.dp, vertical = 8.dp),
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Rounded.TableRestaurant, null, tint = MonoInk, modifier = Modifier.size(16.dp))
                                                Spacer(Modifier.width(6.dp))
                                                Text(stringResource(R.string.take_order_back), color = MonoInk, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                            }
                                        }
                                    }
                                }
                                Spacer(Modifier.height(16.dp))

                                IosSectionHeader(stringResource(R.string.take_order_lines))
                                val lineas = pedido.detalles.orEmpty()
                                if (lineas.isEmpty()) {
                                    Text(
                                        stringResource(R.string.take_order_empty_lines),
                                        fontSize = 14.sp, color = MonoSub,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 6.dp),
                                    )
                                } else {
                                    IosCardSurface(Modifier.fillMaxWidth()) {
                                        LazyColumn(modifier = Modifier.heightIn(max = 200.dp).fillMaxWidth()) {
                                            items(lineas, key = { it.idDetalle ?: it.hashCode() }) { line ->
                                                LineRow(line = line, onDelete = { vm.deleteLine(line.idDetalle) })
                                            }
                                        }
                                    }
                                }
                                Spacer(Modifier.height(12.dp))
                                IosFilledButton(
                                    text = stringResource(R.string.take_order_finalize),
                                    loading = state.loading,
                                    enabled = lineas.isNotEmpty() && !state.loading,
                                    leadingIcon = Icons.Rounded.ReceiptLong,
                                    onClick = { selectedMetodoPago = "EFECTIVO"; showPaymentDialog = true },
                                )
                                Spacer(Modifier.height(16.dp))

                                // Catálogo
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp)) {
                                    Text(
                                        stringResource(R.string.take_order_add_lines).uppercase(),
                                        fontSize = 13.sp, color = MonoSub, letterSpacing = 0.3.sp,
                                        modifier = Modifier.weight(1f),
                                    )
                                    Box(
                                        Modifier.widthIn(max = 170.dp).clip(RoundedCornerShape(10.dp)).background(MonoFill),
                                    ) {
                                        TextField(
                                            value = searchQuery,
                                            onValueChange = { searchQuery = it },
                                            placeholder = { Text("Buscar", fontSize = 14.sp, color = MonoSubLight) },
                                            leadingIcon = { Icon(Icons.Rounded.Search, null, modifier = Modifier.size(16.dp), tint = MonoSubLight) },
                                            singleLine = true,
                                            colors = TextFieldDefaults.colors(
                                                focusedContainerColor = Color.Transparent,
                                                unfocusedContainerColor = Color.Transparent,
                                                focusedIndicatorColor = Color.Transparent,
                                                unfocusedIndicatorColor = Color.Transparent,
                                                cursorColor = MonoInk,
                                                focusedTextColor = MonoText,
                                                unfocusedTextColor = MonoText,
                                            ),
                                            modifier = Modifier.height(44.dp),
                                        )
                                    }
                                }
                                Spacer(Modifier.height(8.dp))
                                if (state.productos.isEmpty()) {
                                    EmptyCatalogHint(
                                        title = stringResource(R.string.take_order_empty_products_title),
                                        body = stringResource(R.string.take_order_empty_products_body),
                                        onRefresh = { vm.reloadInitial() },
                                    )
                                } else {
                                    val searchLower = searchQuery.trim().lowercase()
                                    val isSearching = searchLower.isNotBlank()
                                    val filteredProductos = if (!isSearching) state.productos else {
                                        state.productos.filter {
                                            it.nombre.orEmpty().lowercase().contains(searchLower) ||
                                                it.nombreCategoria.orEmpty().lowercase().contains(searchLower)
                                        }
                                    }
                                    val grouped = filteredProductos
                                        .groupBy { it.nombreCategoria.orEmpty().ifBlank { "Otros" } }
                                        .entries
                                        .sortedBy { (cat, _) -> categoryOrder(cat) }
                                    val expandedMap = remember { mutableStateMapOf<String, Boolean>() }
                                    grouped.forEach { (cat, _) -> if (cat !in expandedMap) expandedMap[cat] = true }
                                    LazyColumn(
                                        verticalArrangement = Arrangement.spacedBy(10.dp),
                                        modifier = Modifier.weight(1f),
                                    ) {
                                        grouped.forEach { (categoria, productos) ->
                                            val expanded = if (isSearching) true else expandedMap[categoria] != false
                                            item(key = "header_$categoria") {
                                                CategoryHeader(
                                                    nombre = categoria,
                                                    count = productos.size,
                                                    expanded = expanded,
                                                    onClick = { if (!isSearching) expandedMap[categoria] = !expanded },
                                                )
                                            }
                                            if (expanded) {
                                                val chunks = productos.chunked(2)
                                                items(count = chunks.size, key = { "chunk_${categoria}_$it" }) { idx ->
                                                    val par = chunks[idx]
                                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                                        par.forEach { p ->
                                                            ProductCard(
                                                                producto = p,
                                                                onAdd = { productDraft = p; qtyText = "1"; notesText = "" },
                                                                modifier = Modifier.weight(1f),
                                                            )
                                                        }
                                                        if (par.size == 1) Spacer(Modifier.weight(1f))
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Dialog: método de pago
    if (showPaymentDialog) {
        val metodos = listOf(
            Triple("EFECTIVO",   stringResource(R.string.take_order_payment_cash),   Icons.Rounded.Payments),
            Triple("TARJETA",    stringResource(R.string.take_order_payment_card),   Icons.Rounded.CreditCard),
            Triple("BIZUM",      stringResource(R.string.take_order_payment_bizum),  Icons.Rounded.PhoneAndroid),
            Triple("INVITACION", stringResource(R.string.take_order_payment_invite), Icons.Rounded.CardGiftcard),
        )
        AlertDialog(
            onDismissRequest = { showPaymentDialog = false },
            containerColor = MonoCard,
            icon = {
                Box(
                    Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(MonoInk),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.ReceiptLong, null, tint = Color.White, modifier = Modifier.size(26.dp))
                }
            },
            title = { Text(stringResource(R.string.take_order_payment_title), color = MonoText, fontWeight = FontWeight.SemiBold) },
            text = {
                Column {
                    Text(stringResource(R.string.take_order_payment_subtitle), fontSize = 13.sp, color = MonoSub)
                    Spacer(Modifier.height(14.dp))
                    metodos.forEach { (valor, etiqueta, icono) ->
                        val sel = selectedMetodoPago == valor
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (sel) MonoInk.copy(alpha = 0.12f) else MonoFill)
                                .clickable { selectedMetodoPago = valor }
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(icono, null, modifier = Modifier.size(22.dp), tint = if (sel) MonoInk else MonoSub)
                            Spacer(Modifier.width(12.dp))
                            Text(etiqueta, fontSize = 16.sp, color = if (sel) MonoText else MonoSub, modifier = Modifier.weight(1f))
                            if (sel) {
                                Box(Modifier.size(22.dp).background(MonoInk, CircleShape), contentAlignment = Alignment.Center) {
                                    Icon(Icons.Rounded.Done, null, modifier = Modifier.size(14.dp), tint = Color.White)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showPaymentDialog = false; vm.finalizarPedido(selectedMetodoPago) }) {
                    Text(stringResource(R.string.take_order_confirm_payment), color = MonoInk, fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showPaymentDialog = false }) {
                    Text(stringResource(R.string.take_order_cancel), color = MonoSub)
                }
            },
        )
    }

    // Dialog: añadir producto
    if (productDraft != null) {
        val p = productDraft!!
        AlertDialog(
            onDismissRequest = { productDraft = null },
            containerColor = MonoCard,
            icon = {
                Box(
                    Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(MonoInk),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Rounded.RestaurantMenu, null, tint = Color.White, modifier = Modifier.size(26.dp))
                }
            },
            title = { Text(p.nombre.orEmpty(), fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = MonoText) },
            text = {
                Column {
                    Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(MonoFill)) {
                        TextField(
                            value = qtyText,
                            onValueChange = { qtyText = it.filter { ch -> ch.isDigit() } },
                            placeholder = { Text(stringResource(R.string.take_order_qty), color = MonoSubLight) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = dialogFieldColors(),
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(MonoFill)) {
                        TextField(
                            value = notesText,
                            onValueChange = { notesText = it },
                            placeholder = { Text(stringResource(R.string.take_order_notes), color = MonoSubLight) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = dialogFieldColors(),
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    val id = p.idProducto ?: return@TextButton
                    val qty = qtyText.toIntOrNull() ?: 1
                    vm.addLine(id, qty, notesText)
                    productDraft = null
                }) {
                    Text(stringResource(R.string.take_order_add), color = MonoInk, fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                TextButton(onClick = { productDraft = null }) {
                    Text(stringResource(R.string.take_order_cancel), color = MonoSub)
                }
            },
        )
    }
}

@Composable
private fun dialogFieldColors() = TextFieldDefaults.colors(
    focusedContainerColor = Color.Transparent,
    unfocusedContainerColor = Color.Transparent,
    focusedIndicatorColor = Color.Transparent,
    unfocusedIndicatorColor = Color.Transparent,
    cursorColor = MonoInk,
    focusedTextColor = MonoText,
    unfocusedTextColor = MonoText,
)

// Mesa chip

@Composable
private fun MesaChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .clip(RoundedCornerShape(99.dp))
            .background(if (selected) MonoInk else MonoCard)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 9.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Rounded.TableRestaurant, null, tint = if (selected) Color.White else MonoInk, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp) )
            Text(label, fontSize = 15.sp, color = if (selected) Color.White else MonoText, fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal)
        }
    }
}

// Empty / error helpers

@Composable
private fun EmptyCatalogHint(title: String, body: String, onRefresh: () -> Unit) {
    IosCardSurface(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Rounded.Info, null, tint = MonoInk, modifier = Modifier.size(20.dp))
                Text(title, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = MonoText, modifier = Modifier.padding(start = 8.dp))
            }
            Spacer(Modifier.height(8.dp))
            Text(body, fontSize = 14.sp, color = MonoSub)
            Spacer(Modifier.height(12.dp))
            Box(
                Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(MonoInk.copy(alpha = 0.12f))
                    .clickable(onClick = onRefresh)
                    .padding(horizontal = 14.dp, vertical = 8.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Refresh, null, tint = MonoInk, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(stringResource(R.string.take_order_reload_catalog), color = MonoInk, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

@Composable
private fun ErrorPanel(message: String, onRetry: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            Modifier.size(72.dp).background(MonoRed.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Rounded.ErrorOutline, null, tint = MonoRed, modifier = Modifier.size(36.dp))
        }
        Spacer(Modifier.height(18.dp))
        Text(message, fontSize = 16.sp, color = MonoText, textAlign = TextAlign.Center)
        Spacer(Modifier.height(22.dp))
        IosFilledButton(
            text = stringResource(R.string.take_order_retry),
            leadingIcon = Icons.Rounded.Refresh,
            onClick = onRetry,
            modifier = Modifier.widthIn(max = 240.dp),
        )
    }
}

// LineRow

@Composable
private fun LineRow(line: DetallePedidoDto, onDelete: () -> Unit) {
    val qty = line.cantidad ?: 0
    val name = line.nombreProducto.orEmpty()
    val notes = line.notas?.takeIf { it.isNotBlank() }
    Row(
        Modifier.fillMaxWidth().padding(start = 14.dp, end = 4.dp, top = 4.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier.size(30.dp).clip(RoundedCornerShape(8.dp)).background(MonoInk.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) {
            Text("$qty", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = MonoInk)
        }
        Spacer(Modifier.width(12.dp))
        Text(
            buildString { append(name); if (notes != null) append(" · $notes") },
            fontSize = 16.sp, color = MonoText, modifier = Modifier.weight(1f),
        )
        IconButton(onClick = onDelete) {
            Icon(Icons.Rounded.Delete, contentDescription = "Eliminar línea", tint = MonoRed)
        }
    }
}

// CategoryHeader

@Composable
private fun CategoryHeader(nombre: String, count: Int, expanded: Boolean, onClick: () -> Unit) {
    val arrowAngle by animateFloatAsState(
        targetValue = if (expanded) 0f else -90f,
        animationSpec = tween(200),
        label = "arrow_$nombre",
    )
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MonoCard)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 12.dp),
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(nombre, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = MonoText, modifier = Modifier.weight(1f))
            Text("$count", fontSize = 14.sp, color = MonoSub)
            Spacer(Modifier.width(6.dp))
            Icon(
                Icons.Rounded.KeyboardArrowDown,
                contentDescription = if (expanded) "Colapsar" else "Expandir",
                modifier = Modifier.size(22.dp).rotate(arrowAngle),
                tint = MonoSubLight,
            )
        }
    }
}

// ProductCard

@Composable
private fun ProductCard(producto: ProductoDto, onAdd: () -> Unit, modifier: Modifier = Modifier) {
    val isAgotado = (producto.stockActual ?: 1) <= 0
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val pressScale by animateFloatAsState(
        targetValue = if (pressed) 0.96f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessHigh),
        label = "prod_scale",
    )

    Box(modifier = modifier) {
        IosCardSurface(
            Modifier
                .fillMaxWidth()
                .then(if (isAgotado) Modifier.alpha(0.55f) else Modifier),
        ) {
            Box(
                Modifier.clickable(
                    interactionSource = interaction,
                    indication = null,
                    enabled = !isAgotado,
                    onClick = onAdd,
                ),
            ) {
                Column {
                    Box(
                        Modifier.fillMaxWidth().height(120.dp).background(MonoFill),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (!producto.imagenUrl.isNullOrBlank()) {
                            SubcomposeAsyncImage(
                                model = ImageRequest.Builder(LocalContext.current).data(producto.imagenUrl).crossfade(true).build(),
                                contentDescription = producto.nombre,
                                contentScale = ContentScale.Fit,
                                modifier = Modifier.fillMaxSize(),
                                loading = {
                                    Box(Modifier.fillMaxSize().background(MonoFill), contentAlignment = Alignment.Center) {
                                        CircularProgressIndicator(modifier = Modifier.size(26.dp), strokeWidth = 2.dp, color = MonoInk)
                                    }
                                },
                                error = {
                                    Box(Modifier.fillMaxSize().background(MonoFill), contentAlignment = Alignment.Center) {
                                        Icon(Icons.Rounded.RestaurantMenu, null, modifier = Modifier.size(38.dp), tint = MonoSubLight)
                                    }
                                },
                            )
                        } else {
                            Box(Modifier.fillMaxSize().background(MonoFill), contentAlignment = Alignment.Center) {
                                Icon(Icons.Rounded.RestaurantMenu, null, modifier = Modifier.size(38.dp), tint = MonoSubLight)
                            }
                        }
                    }
                    if (!producto.nombre.isNullOrBlank()) {
                        Text(
                            producto.nombre,
                            fontSize = 14.sp, fontWeight = FontWeight.Medium, color = MonoText,
                            maxLines = 1, overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.padding(horizontal = 12.dp).padding(top = 8.dp),
                        )
                    }
                    Row(
                        Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            stringResource(R.string.take_order_product_price, formatMoney(producto.precio)),
                            fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = MonoInk,
                            modifier = Modifier.weight(1f),
                        )
                        if (!isAgotado) {
                            Box(
                                Modifier.size(26.dp).scale(pressScale).background(MonoInk, CircleShape),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Rounded.Add, null, tint = Color.White, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }
            }
        }
        if (isAgotado) {
            Box(
                Modifier.matchParentSize().clip(RoundedCornerShape(16.dp)).background(Color.Black.copy(alpha = 0.35f)),
                contentAlignment = Alignment.Center,
            ) {
                Box(Modifier.clip(RoundedCornerShape(8.dp)).background(MonoRed).padding(horizontal = 12.dp, vertical = 6.dp)) {
                    Text("AGOTADO", fontSize = 13.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp, color = Color.White)
                }
            }
        }
    }
}

/** Orden típico de carta en un restaurante español. */
private fun categoryOrder(name: String): Int {
    val n = name.lowercase().trim()
    return when {
        n.contains("bebida") || n.contains("refresco") || n.contains("zumo") ||
            n.contains("agua") || n.contains("soft") || n.contains("vino") ||
            n.contains("cerveza") || n.contains("copa") || n.contains("alcohol") ||
            n.contains("destilado") -> 0
        n.contains("aperitiv") || n.contains("tapa") ||
            n.contains("montadito") || n.contains("pincho") || n.contains("ración") -> 1
        n.contains("entrant") || n.contains("primer") -> 2
        n.contains("ensalada") || n.contains("sopa") ||
            n.contains("crema") || n.contains("gazpacho") || n.contains("verdura") -> 3
        n.contains("arroz") || n.contains("pasta") ||
            n.contains("fideos") || n.contains("risotto") -> 4
        n.contains("pescado") || n.contains("marisco") ||
            n.contains("molus") || n.contains("cefalóp") -> 5
        n.contains("carne") || n.contains("ave") || n.contains("pollo") ||
            n.contains("ternera") || n.contains("cerdo") ||
            n.contains("cordero") || n.contains("caza") -> 6
        n.contains("segundo") || n.contains("principal") || n.contains("plato") -> 7
        n.contains("bocadillo") || n.contains("sandwich") || n.contains("sándwich") ||
            n.contains("hamburguesa") || n.contains("wrap") -> 8
        n.contains("postre") || n.contains("dulce") || n.contains("helado") ||
            n.contains("tarta") || n.contains("pastel") || n.contains("bizcocho") -> 9
        n.contains("cóctel") || n.contains("coctel") ||
            n.contains("cubata") || n.contains("combinado") -> 10
        n.contains("café") || n.contains("cafe") || n.contains("infusión") ||
            n.contains("infusion") || n.contains("té") -> 11
        else -> 99
    }
}
