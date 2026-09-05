package dev.timeframe.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Visual Tokens per TIMEFRAME-UI-REDESIGN.md and update.md §4.2 (Graphite-and-Amber)
val SurfaceBase = Color(0xFF171819)
val SurfaceRaised = Color(0xFF202122)
val SurfaceOverlay = Color(0xFF2B2D2F)

val TextPrimary = Color(0xFFECECE7)
val TextSecondary = Color(0xFFC1C5C1)
val TextTertiary = Color(0xFFA1A9A5)
val TextSupporting = Color(0xFFC1C5C1)
val TextDisabled = Color(0xFF737978)

val BorderSubtle = Color(0xFF3A3D3E)
val BorderDefault = Color(0xFF3A3D3E)
val BorderStrong = Color(0xFF737978)
val BorderFocus = Color(0xFFECECE7)
val FillSelected = Color(0xFF2B2D2F)

val CatFocus = Color(0xFFDDB66D)
val CatSink = Color(0xFFDFA095)
val CatGames = Color(0xFFC1C5C1)
val CatOther = Color(0xFFA1A9A5)
val CatUnclassified = Color(0xFF737978)
val CatPrivate = Color(0xFF737978)
val AccentCreature = Color(0xFFDDB66D)

val StateWarn = Color(0xFFDDB66D)
val StateError = Color(0xFFDFA095)

private val DarkColorScheme = darkColorScheme(
    primary = CatFocus,
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
