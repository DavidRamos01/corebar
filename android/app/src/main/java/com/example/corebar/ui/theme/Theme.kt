package com.example.corebar.ui.theme

import android.app.Activity
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat

// Esquema oscuro (tema principal)
private val DarkColorScheme = darkColorScheme(
    primary                = Gold500,
    onPrimary              = Color(0xFF1C0C00),
    primaryContainer       = Color(0xFF2C1600),
    onPrimaryContainer     = Gold300,
    secondary              = Emerald500,
    onSecondary            = Color(0xFF012318),
    secondaryContainer     = Color(0xFF032D1E),
    onSecondaryContainer   = Emerald300,
    tertiary               = Violet400,
    onTertiary             = Color(0xFF150B40),
    tertiaryContainer      = Color(0xFF1A1250),
    onTertiaryContainer    = Violet400,
    background             = NightBg,
    onBackground           = CloudWhite,
    surface                = NightSurface,
    onSurface              = CloudWhite,
    surfaceVariant         = NightSurfaceMid,
    onSurfaceVariant       = SlateLight,
    outline                = NightRim,
    outlineVariant         = NightRimFaint,
    error                  = Rose500,
    onError                = Color.White,
    errorContainer         = Color(0xFF3B0A14),
    onErrorContainer       = Rose300,
    inverseSurface         = CloudWhite,
    inverseOnSurface       = NightBg,
    inversePrimary         = Gold700,
)

// Esquema claro minimalista (tema principal)
private val LightColorScheme = lightColorScheme(
    primary                = MonoInk,
    onPrimary              = Color.White,
    primaryContainer       = MonoFill,
    onPrimaryContainer     = MonoInk,
    secondary              = MonoGreen,
    onSecondary            = Color.White,
    secondaryContainer     = Color(0xFFDCFCE7),
    onSecondaryContainer   = Color(0xFF14532D),
    tertiary               = MonoInk,
    onTertiary             = Color.White,
    tertiaryContainer      = MonoFill,
    onTertiaryContainer    = MonoInk,
    background             = MonoBg,
    onBackground           = MonoText,
    surface                = MonoCard,
    onSurface              = MonoText,
    surfaceVariant         = MonoFill,
    onSurfaceVariant       = MonoSub,
    outline                = MonoBorder,
    outlineVariant         = MonoBorder,
    error                  = MonoRed,
    onError                = Color.White,
    errorContainer         = Color(0xFFFEE2E2),
    onErrorContainer       = Color(0xFF991B1B),
)

// Formas redondeadas
private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small      = RoundedCornerShape(12.dp),
    medium     = RoundedCornerShape(16.dp),
    large      = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

@Composable
fun CorebarTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit,
) {
    // Estilo iOS claro siempre, sin Dynamic Color
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography  = Typography,
        shapes      = AppShapes,
        content     = content,
    )
}
