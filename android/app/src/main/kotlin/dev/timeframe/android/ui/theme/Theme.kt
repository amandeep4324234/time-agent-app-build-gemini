package dev.timeframe.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Visual Tokens per TIMEFRAME-UI-REDESIGN.md §4.1
val SurfaceBase = Color(0xFF0D1117)
val SurfaceRaised = Color(0xFF141A22)
val SurfaceOverlay = Color(0xFF202A36)

val TextPrimary = Color(0xFFEDF1F5)
val TextSecondary = Color(0xFFB0BBC9)
val TextTertiary = Color(0xFF94A1B2)
val TextSupporting = Color(0xFFB0BBC9)
val TextDisabled = Color(0xFF627086)

val BorderSubtle = Color(0xFF303B49)
val BorderDefault = Color(0xFF303B49)
val BorderStrong = Color(0xFF303B49)
val BorderFocus = Color(0xFFE7EEF7)
val FillSelected = Color(0xFF1D2530)

val CatFocus = Color(0xFFE4B45F)
val CatSink = Color(0xFFF28D87)
val CatGames = Color(0xFFB3BBC7)
val CatOther = Color(0xFF8795A8)
val CatUnclassified = Color(0xFF627086)
val CatPrivate = Color(0xFF627086)
val AccentCreature = Color(0xFFE4B45F)

val StateWarn = Color(0xFFE4B45F)
val StateError = Color(0xFFF28D87)

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
