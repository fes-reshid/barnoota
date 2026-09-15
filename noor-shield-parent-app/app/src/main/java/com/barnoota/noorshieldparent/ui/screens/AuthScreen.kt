package com.barnoota.noorshieldparent.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.barnoota.noorshieldparent.network.SupabaseClient
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(supabase: SupabaseClient, onSignedIn: () -> Unit) {
    var isSignUp by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var checkEmail by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Noor Shield", style = MaterialTheme.typography.headlineMedium)
        Text(
            "Manage bedtime, blocked sites, and lock your family's paired PCs from your phone.",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(top = 4.dp, bottom = 20.dp),
        )

        if (checkEmail) {
            Text(
                "Account created — check your email to confirm it, then sign in below.",
                style = MaterialTheme.typography.bodyMedium,
            )
            return@Column
        }

        OutlinedTextField(
            value = email,
            onValueChange = { email = it; error = null },
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = password,
            onValueChange = { password = it; error = null },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        )

        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
        }

        Button(
            onClick = {
                if (email.isBlank() || password.isBlank()) {
                    error = "Enter your email and password."
                    return@Button
                }
                busy = true
                error = null
                scope.launch {
                    val result = if (isSignUp) {
                        supabase.signUp(email.trim(), password).map { sessionCreated ->
                            if (sessionCreated) onSignedIn() else checkEmail = true
                        }
                    } else {
                        supabase.signIn(email.trim(), password).onSuccess { onSignedIn() }
                    }
                    result.onFailure { error = it.message ?: "Something went wrong." }
                    busy = false
                }
            },
            enabled = !busy,
            colors = ButtonDefaults.buttonColors(),
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
        ) {
            if (busy) {
                CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp))
            }
            Text(if (isSignUp) "Create account" else "Sign in")
        }

        TextButton(
            onClick = { isSignUp = !isSignUp; error = null },
            modifier = Modifier.align(Alignment.CenterHorizontally).padding(top = 4.dp),
        ) {
            Text(if (isSignUp) "Already have an account? Sign in" else "New here? Create an account")
        }
    }
}
