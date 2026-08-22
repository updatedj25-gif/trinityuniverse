package com.trinityuniverse.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.trinityuniverse.ai.ui.screens.MainScreen
import com.trinityuniverse.ai.ui.theme.TrinityTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TrinityTheme {
                MainScreen()
            }
        }
    }
}
