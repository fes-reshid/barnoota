package com.barnoota.noorshield.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val NoorGreen = Color(0xFF1B5E4F)
private val NoorGold = Color(0xFFC9A24B)
private val NoorDarkBg = Color(0xFF0A1A14)

private val DarkColors = darkColorScheme(
    primary = NoorGold,
    secondary = NoorGreen,
    background = NoorDarkBg,
    surface = Color(0xFF102821),
)

private val LightColors = lightColorScheme(
    primary = NoorGreen,
    secondary = NoorGold,
    background = Color(0xFFF6F5F0),
    surface = Color.White,
)

@Composable
fun NoorShieldTheme(content: @Composable () -> Unit) {
    val colors = if (isSystemInDarkTheme()) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
