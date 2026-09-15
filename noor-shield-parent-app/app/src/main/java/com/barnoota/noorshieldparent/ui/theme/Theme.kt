package com.barnoota.noorshieldparent.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Same palette as noor-shield-pc's styles.css and the web dashboard, so
// this app reads as the same product on every screen.
val Sand = Color(0xFFF6F5F0)
val Surface2 = Color(0xFFEDEAE1)
val Ink = Color(0xFF16241D)
val InkSoft = Color(0xFF4B5A52)
val Green = Color(0xFF1B5E4F)
val GreenDeep = Color(0xFF0A1A14)
val GreenDim = Color(0xFF2A6F5E)
val Gold = Color(0xFFC9A24B)
val Good = Color(0xFF2E7D32)
val Warn = Color(0xFFB26A00)
val Danger = Color(0xFFA3352B)

private val NoorShieldParentColors = lightColorScheme(
    primary = Green,
    onPrimary = Sand,
    secondary = Gold,
    onSecondary = GreenDeep,
    background = Sand,
    onBackground = Ink,
    surface = Sand,
    onSurface = Ink,
    surfaceVariant = Surface2,
    onSurfaceVariant = InkSoft,
    error = Danger,
)

@Composable
fun NoorShieldParentTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = NoorShieldParentColors, content = content)
}
