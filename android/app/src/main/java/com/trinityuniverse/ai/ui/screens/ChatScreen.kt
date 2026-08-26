package com.trinityuniverse.ai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.trinityuniverse.ai.ui.components.*
import com.trinityuniverse.ai.ui.theme.*
import com.trinityuniverse.ai.ui.viewmodel.ChatViewModel
import kotlinx.coroutines.launch

import com.trinityuniverse.ai.data.repository.UpdateManager
import com.trinityuniverse.ai.data.repository.AppVersionInfo
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import androidx.compose.ui.platform.LocalContext


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    viewModel: ChatViewModel = viewModel(),
    onOpenDrawer: () -> Unit = {}
) {
    val activeTenant by viewModel.activeTenant.collectAsState()

    val context = LocalContext.current
    val updateManager = remember { UpdateManager(context) }
    var availableUpdate by remember { mutableStateOf<AppVersionInfo?>(null) }

    LaunchedEffect(Unit) {
        availableUpdate = updateManager.checkForUpdates()
    }

    if (availableUpdate != null) {
        AlertDialog(
            onDismissRequest = { availableUpdate = null },
            title = { Text("Update Available", fontWeight = androidx.compose.ui.text.font.FontWeight.Bold) },
            text = { Text(availableUpdate?.releaseNotes ?: "A new version of Gnosis AI is ready.") },
            confirmButton = {
                TextButton(onClick = {
                    availableUpdate?.downloadUrl?.let { updateManager.startDownload(it) }
                    availableUpdate = null
                }) {
                    Text("Update Now")
                }
            },
            dismissButton = {
                TextButton(onClick = { availableUpdate = null }) {
                    Text("Later")
                }
            }
        )
    }

    val tenants by viewModel.tenants.collectAsState()
    val messages by viewModel.messages.collectAsState()
    val inputText by viewModel.inputText.collectAsState()
    val attachments by viewModel.attachments.collectAsState()
    val selectedPill by viewModel.selectedPill.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    var showTenantDialog by remember { mutableStateOf(false) }

    val canvasBackground = Color(activeTenant.canvasBgHex)

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(imageVector = Icons.Default.Menu, contentDescription = "Menu", tint = TextPrimary)
                    }
                },
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(Color(0xFFE7E5E4))
                            .clickable { showTenantDialog = true }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = activeTenant.pillLabel,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(activeTenant.accentColorHex)
                        )
                        Icon(
                            imageVector = Icons.Default.SwapHoriz,
                            contentDescription = "Switch Persona",
                            tint = TextSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = canvasBackground
                )
            )
        },
        containerColor = canvasBackground
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (messages.isEmpty()) {
                // ── HERO CENTERED EMPTY STATE ──
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 24.dp, vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = if (activeTenant.id == "yada") "Consult with Yada Guide" else "Start chatting with ${activeTenant.name}",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = if (activeTenant.fontStyle == "serif") FontFamily.Serif else FontFamily.SansSerif,
                        color = TextPrimary,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    ModelSelectorPills(
                        selectedPill = selectedPill,
                        onPillSelected = { viewModel.setSelectedPill(it) }
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    ChatInputBox(
                        text = inputText,
                        onTextChange = { viewModel.setInputText(it) },
                        attachments = attachments,
                        onRemoveAttachment = { viewModel.removeAttachment(it) },
                        onAttachClick = { /* File picker */ },
                        onSendClick = { viewModel.sendMessage() },
                        isLoading = isLoading,
                        tenant = activeTenant
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Suggested prompt pill cards
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        activeTenant.suggestedPrompts.forEach { prompt ->
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(WhiteBubble)
                                    .border(1.dp, CardBorder, RoundedCornerShape(999.dp))
                                    .clickable { viewModel.sendMessage(prompt) }
                                    .padding(horizontal = 16.dp, vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = prompt,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = TextPrimary,
                                    textAlign = TextAlign.Center,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            } else {
                // ── ACTIVE MESSAGE THREAD ──
                Column(modifier = Modifier.fillMaxSize()) {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        contentPadding = PaddingValues(vertical = 16.dp)
                    ) {
                        items(messages, key = { it.id }) { msg ->
                            MessageBubble(
                                message = msg,
                                tenant = activeTenant
                            )
                        }
                    }

                    // Pinned Bottom Input Box
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        ChatInputBox(
                            text = inputText,
                            onTextChange = { viewModel.setInputText(it) },
                            attachments = attachments,
                            onRemoveAttachment = { viewModel.removeAttachment(it) },
                            onAttachClick = { /* File picker */ },
                            onSendClick = { viewModel.sendMessage() },
                            isLoading = isLoading,
                            tenant = activeTenant
                        )
                    }
                }
            }
        }

        // Persona Selection Dialog
        if (showTenantDialog) {
            AlertDialog(
                onDismissRequest = { showTenantDialog = false },
                title = { Text("Select Persona", fontWeight = FontWeight.Bold) },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        tenants.forEach { t ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (t.id == activeTenant.id) Color(0xFFF1F5F9) else Color.Transparent)
                                    .clickable {
                                        viewModel.selectTenant(t)
                                        showTenantDialog = false
                                    }
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(
                                    text = t.pillLabel,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(t.accentColorHex)
                                )
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showTenantDialog = false }) {
                        Text("Close")
                    }
                }
            )
        }
    }
}
