package com.example.corebar.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.DinnerDining
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.corebar.ui.theme.MonoCard
import com.example.corebar.ui.theme.MonoGreen
import com.example.corebar.ui.theme.MonoText
import com.example.corebar.ui.theme.MonoSub
import kotlinx.coroutines.delay

/** Aviso flotante que baja desde arriba cuando uno o varios platos quedan listos */
@Composable
fun ReadyToast(
    lines: List<Pair<String, String>>,   // (mesa, nombrePlato)
    onDismiss: () -> Unit,
    autoHideMs: Long = 5_000L,
) {
    var progress by remember(lines) { mutableFloatStateOf(1f) }
    val animProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = autoHideMs.toInt(), easing = LinearEasing),
        label = "toast_progress",
    )

    var entered by remember(lines) { mutableStateOf(false) }
    val entryScale by animateFloatAsState(
        targetValue = if (entered) 1f else 0.88f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMediumLow),
        label = "toast_scale",
    )
    val entryAlpha by animateFloatAsState(
        targetValue = if (entered) 1f else 0f,
        animationSpec = tween(300, easing = FastOutSlowInEasing),
        label = "toast_alpha",
    )
    val entryOffsetY by animateDpAsState(
        targetValue = if (entered) 0.dp else (-28).dp,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "toast_offset",
    )

    LaunchedEffect(lines) {
        entered = true
        progress = 0f
        delay(autoHideMs)
        onDismiss()
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .graphicsLayer {
                scaleX = entryScale
                scaleY = entryScale
                alpha = entryAlpha
                translationY = entryOffsetY.toPx()
            },
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(14.dp, RoundedCornerShape(20.dp), spotColor = Color.Black.copy(alpha = 0.18f))
                .clip(RoundedCornerShape(20.dp))
                .background(MonoCard),
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 14.dp, end = 6.dp, top = 14.dp, bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier.size(40.dp).clip(RoundedCornerShape(11.dp)).background(MonoGreen),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Rounded.DinnerDining, null, tint = Color.White, modifier = Modifier.size(24.dp))
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Listo para recoger",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MonoText,
                        )
                        Text(
                            text = if (lines.size == 1) "1 plato te espera" else "${lines.size} platos te esperan",
                            fontSize = 13.sp,
                            color = MonoSub,
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(36.dp)) {
                        Icon(Icons.Rounded.Close, "Cerrar notificación", tint = MonoSub, modifier = Modifier.size(18.dp))
                    }
                }

                Column(modifier = Modifier.padding(start = 14.dp, end = 14.dp, bottom = 12.dp)) {
                    lines.forEach { (mesa, plato) ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(Icons.Rounded.CheckCircle, null, tint = MonoGreen, modifier = Modifier.size(17.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = buildAnnotatedString {
                                    withStyle(SpanStyle(fontWeight = FontWeight.SemiBold, color = MonoText)) { append(mesa) }
                                    withStyle(SpanStyle(color = MonoSub, fontWeight = FontWeight.Normal)) { append("  ·  $plato") }
                                },
                                fontSize = 14.sp,
                            )
                        }
                    }
                }

                LinearProgressIndicator(
                    progress = { animProgress },
                    modifier = Modifier.fillMaxWidth().height(3.dp),
                    color = MonoGreen,
                    trackColor = MonoGreen.copy(alpha = 0.15f),
                    strokeCap = StrokeCap.Square,
                )
            }
        }
    }
}
