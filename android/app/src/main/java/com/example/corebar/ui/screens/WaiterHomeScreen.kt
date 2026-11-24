package com.example.corebar.ui.screens

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.rounded.Kitchen
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.TableRestaurant
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.corebar.R
import com.example.corebar.ui.components.BigActionCard
import com.example.corebar.ui.theme.AccentBlue
import com.example.corebar.ui.theme.AccentTeal
import com.example.corebar.ui.theme.AccentViolet
import com.example.corebar.ui.theme.MonoBg
import com.example.corebar.ui.theme.MonoSub
import kotlinx.coroutines.delay
import java.util.Calendar
import java.util.Locale

@Composable
fun WaiterHomeScreen(
    displayName: String,
    onTakeOrder: () -> Unit,
    onOpenTableMap: () -> Unit,
    onKitchenStatus: () -> Unit,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val saludo = buildSaludo()
    val firstName = displayName.trim().split(" ").firstOrNull()?.replaceFirstChar { it.uppercase() } ?: ""
    val initial  = displayName.trim().firstOrNull()?.uppercase() ?: "?"
    val dateStr  = buildDateString()

    var headerVis by remember { mutableStateOf(false) }
    var card1Vis  by remember { mutableStateOf(false) }
    var card2Vis  by remember { mutableStateOf(false) }
    var card3Vis  by remember { mutableStateOf(false) }
    var footerVis by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        headerVis = true;  delay(100)
        card1Vis  = true;  delay(80)
        card2Vis  = true;  delay(80)
        card3Vis  = true;  delay(80)
        footerVis = true
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(AccentBlue.copy(alpha = 0.07f), MonoBg, MonoBg),
                ),
            ),
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .padding(horizontal = 18.dp),
        ) {
            Spacer(Modifier.height(44.dp))

            // Tarjeta de bienvenida
            EntranceBox(visible = headerVis, fromY = (-24).dp) {
                GreetingCard(
                    saludo  = saludo,
                    name    = if (displayName.isBlank()) "" else displayName.trim(),
                    initial = initial,
                    date    = dateStr,
                )
            }

            Spacer(Modifier.height(22.dp))

            // Tarjetas de acción GRANDES
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                EntranceBox(visible = card1Vis, fromY = 48.dp, modifier = Modifier.weight(1f)) {
                    BigActionCard(
                        title    = stringResource(R.string.waiter_take_order),
                        subtitle = stringResource(R.string.take_order_pick_mesa),
                        icon     = Icons.Rounded.TableRestaurant,
                        accent   = AccentBlue,
                        onClick  = onTakeOrder,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
                EntranceBox(visible = card2Vis, fromY = 48.dp, modifier = Modifier.weight(1f)) {
                    BigActionCard(
                        title    = stringResource(R.string.waiter_placeholder_tables),
                        subtitle = stringResource(R.string.waiter_table_map_subtitle),
                        icon     = Icons.Rounded.Map,
                        accent   = AccentTeal,
                        onClick  = onOpenTableMap,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
                EntranceBox(visible = card3Vis, fromY = 48.dp, modifier = Modifier.weight(1f)) {
                    BigActionCard(
                        title    = stringResource(R.string.waiter_kitchen_status),
                        subtitle = stringResource(R.string.waiter_kitchen_subtitle),
                        icon     = Icons.Rounded.Kitchen,
                        accent   = AccentViolet,
                        onClick  = onKitchenStatus,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            // Cerrar sesión
            EntranceBox(visible = footerVis, fromY = 16.dp) {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .clickable(onClick = onLogout)
                        .padding(vertical = 14.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = null,
                            tint = MonoSub,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            stringResource(R.string.waiter_logout),
                            color = MonoSub,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}

// Tarjeta de bienvenida con degradado

@Composable
private fun GreetingCard(
    saludo: String,
    name: String,
    initial: String,
    date: String,
    modifier: Modifier = Modifier,
) {
    // Brillo pulsante del halo de la tarjeta
    val glowTransition = rememberInfiniteTransition(label = "card_glow")
    val glowAlpha by glowTransition.animateFloat(
        initialValue = 0.30f,
        targetValue  = 0.55f,
        animationSpec = infiniteRepeatable(
            animation    = tween(2600, easing = FastOutSlowInEasing),
            repeatMode   = RepeatMode.Reverse,
        ),
        label = "glow_a",
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation    = 24.dp,
                shape        = RoundedCornerShape(28.dp),
                ambientColor = AccentBlue.copy(alpha = glowAlpha * 0.5f),
                spotColor    = AccentViolet.copy(alpha = glowAlpha),
            )
            .clip(RoundedCornerShape(28.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(AccentBlue, AccentViolet),
                ),
            )
            .padding(horizontal = 24.dp, vertical = 24.dp),
    ) {
        // Círculos decorativos de fondo
        Box(
            Modifier
                .size(160.dp)
                .align(Alignment.TopEnd)
                .offset(x = 50.dp, y = (-40).dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.08f)),
        )
        Box(
            Modifier
                .size(90.dp)
                .align(Alignment.BottomStart)
                .offset(x = (-28).dp, y = 28.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.06f)),
        )
        Box(
            Modifier
                .size(50.dp)
                .align(Alignment.TopStart)
                .offset(x = (-14).dp, y = 50.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.05f)),
        )

        // Contenido principal
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                // Saludo pequeño
                Text(
                    text       = saludo,
                    fontSize   = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color      = Color.White.copy(alpha = 0.75f),
                    letterSpacing = 0.3.sp,
                )
                Spacer(Modifier.height(2.dp))
                // Nombre en grande
                Text(
                    text       = if (name.isBlank()) "¡Bienvenido!" else name,
                    fontSize   = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color      = Color.White,
                    lineHeight = 30.sp,
                )
                Spacer(Modifier.height(8.dp))
                // Fecha
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White.copy(alpha = 0.18f))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                ) {
                    Text(
                        text     = date,
                        fontSize = 12.sp,
                        color    = Color.White.copy(alpha = 0.90f),
                        fontWeight = FontWeight.Medium,
                    )
                }
            }

            Spacer(Modifier.width(14.dp))

            // Avatar con inicial
            Box(
                modifier = Modifier
                    .size(58.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.22f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text       = initial,
                    fontSize   = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color      = Color.White,
                )
            }
        }
    }
}

// EntranceBox

@Composable
private fun EntranceBox(
    visible: Boolean,
    fromY: Dp,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val alpha by animateFloatAsState(
        targetValue    = if (visible) 1f else 0f,
        animationSpec  = tween(400),
        label          = "entrance_alpha",
    )
    val offset by animateDpAsState(
        targetValue    = if (visible) 0.dp else fromY,
        animationSpec  = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMediumLow),
        label          = "entrance_offset",
    )
    Box(
        modifier = modifier
            .offset(y = offset)
            .graphicsLayer(alpha = alpha),
    ) { content() }
}

// Helpers

private fun buildSaludo(): String {
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    return when {
        hour < 12 -> "Buenos días"
        hour < 20 -> "Buenas tardes"
        else      -> "Buenas noches"
    }
}

private fun buildDateString(): String {
    val cal  = Calendar.getInstance()
    val dow  = cal.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.LONG, Locale.forLanguageTag("es"))
        ?.replaceFirstChar { it.uppercase() } ?: ""
    val day  = cal.get(Calendar.DAY_OF_MONTH)
    val mon  = cal.getDisplayName(Calendar.MONTH, Calendar.LONG, Locale.forLanguageTag("es"))
        ?.replaceFirstChar { it.uppercase() } ?: ""
    return "$dow, $day de $mon"
}
