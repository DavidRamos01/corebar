package com.example.corebar.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.example.corebar.ui.theme.Gold500
import com.example.corebar.ui.theme.GoldGlow
import com.example.corebar.ui.theme.NightBg
import com.example.corebar.ui.theme.VioletGlow

/** Fondo principal de la app: */
@Composable
fun CorebarBackground(
    modifier: Modifier = Modifier,
    accentTopRight: Boolean = false,
    accentBottomLeft: Boolean = false,
    content: @Composable BoxScope.() -> Unit,
) {
    val bg = MaterialTheme.colorScheme.background

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(bg),
    ) {
        // Gradiente diagonal base
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.25f),
                            Color.Transparent,
                            MaterialTheme.colorScheme.surface.copy(alpha = 0.1f),
                        ),
                        start = Offset(0f, 0f),
                        end   = Offset(Float.POSITIVE_INFINITY, Float.POSITIVE_INFINITY),
                    ),
                ),
        )

        // Halo dorado, esquina superior derecha
        if (accentTopRight) {
            Box(
                Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(GoldGlow, Color.Transparent),
                            center = Offset(Float.POSITIVE_INFINITY, 0f),
                            radius = 800f,
                        ),
                    ),
            )
        }

        // Halo violeta, esquina inferior izquierda
        if (accentBottomLeft) {
            Box(
                Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(VioletGlow, Color.Transparent),
                            center = Offset(0f, Float.POSITIVE_INFINITY),
                            radius = 700f,
                        ),
                    ),
            )
        }

        content()
    }
}

// Compat aliases para código existente que aún llame a CorebarGradientBackground
@Composable
fun CorebarGradientBackground(
    modifier: Modifier = Modifier,
    emphasizePrimary: Boolean = false,
    content: @Composable BoxScope.() -> Unit,
) = CorebarBackground(
    modifier        = modifier,
    accentTopRight  = emphasizePrimary,
    accentBottomLeft = !emphasizePrimary,
    content         = content,
)

@Composable
fun CorebarSubtleRadialOverlay(modifier: Modifier = Modifier) {
    // No-op, el nuevo fondo ya incluye los halos
}
