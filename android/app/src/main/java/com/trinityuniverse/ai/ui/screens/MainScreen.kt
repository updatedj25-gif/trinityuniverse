package com.trinityuniverse.ai.ui.screens

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trinityuniverse.ai.ui.components.AppDrawer
import com.trinityuniverse.ai.ui.viewmodel.ChatViewModel
import kotlinx.coroutines.launch

@Composable
fun MainScreen(
    viewModel: ChatViewModel = viewModel()
) {
    val activeTenant by viewModel.activeTenant.collectAsState()
    val currentView by viewModel.currentView.collectAsState()
    val sessions by viewModel.sessions.collectAsState()
    val activeSessionId by viewModel.activeSessionId.collectAsState()

    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val coroutineScope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                AppDrawer(
                    tenant = activeTenant,
                    sessions = sessions,
                    activeSessionId = activeSessionId,
                    currentView = currentView,
                    onSelectSession = { viewModel.selectSession(it) },
                    onNewSession = { viewModel.newSession() },
                    onOpenLibrary = { viewModel.setView("library") },
                    onOpenFaceSwap = { viewModel.setView("faceswap") },
                    onClearHistory = { viewModel.clearHistory() },
                    onDeleteSession = { viewModel.deleteSession(it) },
                    onCloseDrawer = { coroutineScope.launch { drawerState.close() } }
                )
            }
        }
    ) {
        when (currentView) {
            "library" -> LibraryScreen(
                tenant = activeTenant,
                onOpenDrawer = { coroutineScope.launch { drawerState.open() } },
                onGoHome = { viewModel.setView("chat") }
            )
            "faceswap" -> FaceSwapScreen(
                tenant = activeTenant,
                onOpenDrawer = { coroutineScope.launch { drawerState.open() } },
                onGoHome = { viewModel.setView("chat") }
            )
            else -> ChatScreen(
                viewModel = viewModel,
                onOpenDrawer = { coroutineScope.launch { drawerState.open() } }
            )
        }
    }
}
