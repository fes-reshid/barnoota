package com.barnoota.noorshield.ui

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.EditNote
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.barnoota.noorshield.ui.screens.DashboardScreen
import com.barnoota.noorshield.ui.screens.HadithFeedScreen
import com.barnoota.noorshield.ui.screens.JournalScreen
import com.barnoota.noorshield.ui.screens.SettingsScreen
import com.barnoota.noorshield.ui.theme.NoorShieldTheme

private sealed class Destination(val route: String, val label: String) {
    data object Dashboard : Destination("dashboard", "Shield")
    data object Hadith : Destination("hadith", "Hadith")
    data object Journal : Destination("journal", "Journal")
    data object Settings : Destination("settings", "About")
}

private val destinations = listOf(Destination.Dashboard, Destination.Hadith, Destination.Journal, Destination.Settings)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NoorShieldTheme {
                NoorShieldApp()
            }
        }
    }
}

@Composable
private fun NoorShieldApp() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
        LaunchedEffect(Unit) { launcher.launch(Manifest.permission.POST_NOTIFICATIONS) }
    }

    val navController = rememberNavController()
    Scaffold(
        bottomBar = { NoorShieldBottomBar(navController) },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Destination.Dashboard.route,
            modifier = Modifier.padding(padding),
        ) {
            composable(Destination.Dashboard.route) { DashboardScreen() }
            composable(Destination.Hadith.route) { HadithFeedScreen() }
            composable(Destination.Journal.route) { JournalScreen() }
            composable(Destination.Settings.route) { SettingsScreen() }
        }
    }
}

@Composable
private fun NoorShieldBottomBar(navController: NavHostController) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    NavigationBar {
        destinations.forEach { destination ->
            NavigationBarItem(
                selected = currentRoute == destination.route,
                onClick = {
                    navController.navigate(destination.route) {
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = {
                    Icon(
                        imageVector = when (destination) {
                            Destination.Dashboard -> Icons.Filled.Security
                            Destination.Hadith -> Icons.Filled.Book
                            Destination.Journal -> Icons.Filled.EditNote
                            Destination.Settings -> Icons.Filled.Settings
                        },
                        contentDescription = destination.label,
                    )
                },
                label = { Text(destination.label) },
            )
        }
    }
}
