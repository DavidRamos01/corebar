package com.example.corebar.ui.theme

import androidx.compose.ui.graphics.Color

// Paleta oscura de Corebar

// Gold / Amber, color de marca, CTAs
val Gold500      = Color(0xFFF59E0B)
val Gold400      = Color(0xFFFBBF24)
val Gold300      = Color(0xFFFCD34D)
val Gold700      = Color(0xFFB45309)
val GoldGlow     = Color(0x40F59E0B)   // halo semitransparente

// Emerald, confirmaciones, estados "listo"
val Emerald500   = Color(0xFF10B981)
val Emerald400   = Color(0xFF34D399)
val Emerald300   = Color(0xFF6EE7B7)
val Emerald900   = Color(0xFF064E3B)
val EmeraldGlow  = Color(0x3010B981)

// Violet, tertiary, detalles
val Violet400    = Color(0xFFA78BFA)
val Violet600    = Color(0xFF7C3AED)
val VioletGlow   = Color(0x30A78BFA)

// Rose, errores
val Rose500      = Color(0xFFF43F5E)
val Rose300      = Color(0xFFFDA4AF)
val RoseGlow     = Color(0x30F43F5E)

// Amber light (para "preparando")
val Amber400     = Color(0xFFFBBF24)
val Amber600     = Color(0xFFD97706)

// Fondos oscuros
val NightBg          = Color(0xFF060D1F)   // fondo base
val NightSurface     = Color(0xFF0C1830)   // superficie de cards
val NightSurfaceMid  = Color(0xFF102040)   // cards elevadas
val NightSurfaceHigh = Color(0xFF152A52)   // cards muy elevadas
val NightRim         = Color(0xFF1C3058)   // bordes / divisores
val NightRimFaint    = Color(0xFF0F2040)   // bordes muy sutiles

// Texto
val CloudWhite   = Color(0xFFF0F6FF)
val SlateLight   = Color(0xFF8BA4C4)
val SlateMid     = Color(0xFF4A6285)

// Modo claro (fallback)
val LightBg      = Color(0xFFF4F6FC)
val LightSurface = Color(0xFFFFFFFF)
val LightVariant = Color(0xFFE8EEF8)
val LightRim     = Color(0xFFCBD5E1)

// Paleta clara
// Fondos
val IosBg            = Color(0xFFF2F2F7)   // systemGroupedBackground
val IosBgGrouped     = Color(0xFFEFEFF4)   // ligeramente más cálido para degradado sutil
val IosCard          = Color(0xFFFFFFFF)   // secondarySystemGroupedBackground
val IosCardPressed   = Color(0xFFE5E5EA)   // celda presionada
val IosSeparator     = Color(0xFFD1D1D6)   // separador opaco
val IosSeparatorThin = Color(0x4D3C3C43)   // separador no-opaco (~29%)

// Texto
val IosLabel         = Color(0xFF000000)   // label
val IosSecondary     = Color(0x993C3C43)   // secondaryLabel (~60%)
val IosTertiary      = Color(0x4D3C3C43)   // tertiaryLabel (~30%)

// Acentos del sistema
val IosBlue          = Color(0xFF007AFF)
val IosBlueDark      = Color(0xFF0062CC)
val IosGreen         = Color(0xFF34C759)
val IosGreenDark     = Color(0xFF248A3D)
val IosRed           = Color(0xFFFF3B30)
val IosOrange        = Color(0xFFFF9500)
val IosYellow        = Color(0xFFFFCC00)
val IosPurple        = Color(0xFFAF52DE)
val IosGray          = Color(0xFF8E8E93)
val IosGray2         = Color(0xFFAEAEB2)
val IosGray5         = Color(0xFFE5E5EA)
val IosFill          = Color(0x1F787880)   // systemFill (~12%)
val IosFillSecondary = Color(0x14787880)   // secondarySystemFill

// Paleta casi monocroma
// Blanco y casi negro; el color solo se usa para estados.
val MonoBg          = Color(0xFFF4F4F5)   // fondo app (zinc-100)
val MonoCard        = Color(0xFFFFFFFF)   // tarjetas
val MonoCardAlt     = Color(0xFFFAFAFA)   // tarjeta secundaria
val MonoInk         = Color(0xFF18181B)   // tinta primaria (botones, iconos clave)
val MonoInkSoft     = Color(0xFF27272A)   // tinta presionada
val MonoText        = Color(0xFF18181B)   // texto principal
val MonoSub         = Color(0xFF71717A)   // texto secundario (zinc-500)
val MonoSubLight    = Color(0xFFA1A1AA)   // terciario (zinc-400)
val MonoBorder      = Color(0xFFE4E4E7)   // bordes/separadores (zinc-200)
val MonoFill        = Color(0xFFF4F4F5)   // relleno contenedor icono (zinc-100)

// Estados (uso semántico puntual)
val MonoGreen       = Color(0xFF16A34A)
val MonoAmber       = Color(0xFFD97706)
val MonoRed         = Color(0xFFDC2626)
val MonoBlueState   = Color(0xFF2563EB)

// Acentos de acción, colores vivos pero contenidos
// Se usan en las tarjetas grandes de la home y en los botones de color. Un acento por pantalla.
val AccentBlue      = Color(0xFF3B82F6)   // azul moderno, "Tomar pedido"
val AccentTeal      = Color(0xFF0D9488)   // verde-azul, "Mapa de mesas"
val AccentViolet    = Color(0xFF7C3AED)   // violeta, "Estado de cocina"
val AccentAmber     = Color(0xFFF59E0B)   // ámbar cálido, uso contextual
