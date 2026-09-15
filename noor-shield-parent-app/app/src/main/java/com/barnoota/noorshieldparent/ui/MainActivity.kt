package com.barnoota.noorshieldparent.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.barnoota.noorshieldparent.NoorShieldParentApp
import com.barnoota.noorshieldparent.ui.screens.AuthScreen
import com.barnoota.noorshieldparent.ui.screens.DeviceListScreen
import com.barnoota.noorshieldparent.ui.screens.ManageDeviceScreen
import com.barnoota.noorshieldparent.ui.theme.NoorShieldParentTheme
import com.barnoota.noorshieldparent.data.Device

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val app = application as NoorShieldParentApp

        setContent {
            NoorShieldParentTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    // DataStore's Flow emits its first value almost immediately, so a null
                    // initial (rather than a separate "still loading" state) is an acceptable
                    // simplification — worst case is a one-frame flash of the sign-in screen.
                    val storedSession by app.sessionStore.session.collectAsState(initial = null)
                    if (storedSession == null) {
                        AuthScreen(supabase = app.supabase, onSignedIn = { /* recomposes via storedSession */ })
                    } else {
                        ParentNavHost(app)
                    }
                }
            }
        }
    }
}

@androidx.compose.runtime.Composable
private fun ParentNavHost(app: NoorShieldParentApp) {
    val navController = rememberNavController()
    var selectedDevice by remember { mutableStateOf<Device?>(null) }

    NavHost(navController = navController, startDestination = "devices") {
        composable("devices") {
            DeviceListScreen(
                supabase = app.supabase,
                onOpenDevice = { device ->
                    selectedDevice = device
                    navController.navigate("manage")
                },
                onSignOut = { /* recomposes via storedSession going back to null */ },
            )
        }
        composable("manage") {
            val device = selectedDevice
            if (device != null) {
                ManageDeviceScreen(
                    supabase = app.supabase,
                    device = device,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
