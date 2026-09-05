package dev.timeframe.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val SurfaceBase = Color(0xFF0A0C10)
val SurfaceRaised = Color(0xFF14171F)
val SurfaceOverlay = Color(0xFF1D2129)

val TextPrimary = Color(0xFFF4F6FA)
val TextSecondary = Color(0xFFD9DEE8)
val TextTertiary = Color(0xFFB7BECC)
val TextSupporting = Color(0xFF9AA3B5)
val TextDisabled = Color(0xFF474E5F)

val BorderSubtle = Color(0xFF232833)
val BorderDefault = Color(0xFF2E3440)
val BorderStrong = Color(0xFF454C5C)
val BorderFocus = Color(0xFF22D3EE)
val FillSelected = Color(0xFF2E3440)

val CatFocus = Color(0xFF4ADE80)
val CatSink = Color(0xFFF87171)
val CatGames = Color(0xFFFBBF24)
val CatOther = Color(0xFF60A5FA)
val CatUnclassified = Color(0xFF94A3B8)
val CatPrivate = Color(0xFFA78BFA)
val AccentCreature = Color(0xFF22D3EE)

val StateWarn = Color(0xFFF59E0B)
val StateError = Color(0xFFF87171)

private val DarkColorScheme = darkColorScheme(
    primary = AccentCreature,
    background = SurfaceBase,
    surface = SurfaceRaised,
    surfaceVariant = SurfaceOverlay,
    onPrimary = SurfaceBase,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    outline = BorderDefault
)

@Composable
fun TimeframeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
