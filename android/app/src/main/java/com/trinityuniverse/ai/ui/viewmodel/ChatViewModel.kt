package com.trinityuniverse.ai.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.trinityuniverse.ai.data.models.*
import com.trinityuniverse.ai.data.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class ChatViewModel(
    private val repository: ChatRepository = ChatRepository()
) : ViewModel() {

    private val _tenants = MutableStateFlow(DefaultTenants.list)
    val tenants: StateFlow<List<Tenant>> = _tenants.asStateFlow()

    private val _activeTenant = MutableStateFlow(DefaultTenants.list[0])
    val activeTenant: StateFlow<Tenant> = _activeTenant.asStateFlow()

    private val _currentView = MutableStateFlow("chat") // "chat" | "library" | "faceswap"
    val currentView: StateFlow<String> = _currentView.asStateFlow()

    private val _sessions = MutableStateFlow<List<ChatSession>>(emptyList())
    val sessions: StateFlow<List<ChatSession>> = _sessions.asStateFlow()

    private val _activeSessionId = MutableStateFlow<String?>(null)
    val activeSessionId: StateFlow<String?> = _activeSessionId.asStateFlow()

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _inputText = MutableStateFlow("")
    val inputText: StateFlow<String> = _inputText.asStateFlow()

    private val _attachments = MutableStateFlow<List<Attachment>>(emptyList())
    val attachments: StateFlow<List<Attachment>> = _attachments.asStateFlow()

    private val _selectedPill = MutableStateFlow("Instant")
    val selectedPill: StateFlow<String> = _selectedPill.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun setView(view: String) {
        _currentView.value = view
    }

    fun selectTenant(tenant: Tenant) {
        _activeTenant.value = tenant
        _activeSessionId.value = null
        _messages.value = emptyList()
        _currentView.value = "chat"
    }

    fun selectSession(sessionId: String) {
        _activeSessionId.value = sessionId
        val session = _sessions.value.find { it.id == sessionId }
        _messages.value = session?.messages ?: emptyList()
        _currentView.value = "chat"
    }

    fun newSession() {
        val now = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
        val newS = ChatSession(
            id = "session_" + System.currentTimeMillis(),
            tenantId = _activeTenant.value.id,
            title = "New Conversation",
            createdAt = now,
            updatedAt = now,
            messages = emptyList()
        )
        _sessions.value = listOf(newS) + _sessions.value
        _activeSessionId.value = newS.id
        _messages.value = emptyList()
        _currentView.value = "chat"
    }

    fun deleteSession(sessionId: String) {
        _sessions.value = _sessions.value.filter { it.id != sessionId }
        if (_activeSessionId.value == sessionId) {
            _activeSessionId.value = null
            _messages.value = emptyList()
        }
    }

    fun clearHistory() {
        _sessions.value = _sessions.value.filter { it.tenantId != _activeTenant.value.id }
        _activeSessionId.value = null
        _messages.value = emptyList()
    }

    fun setInputText(text: String) { _inputText.value = text }
    fun setSelectedPill(pill: String) { _selectedPill.value = pill }
    fun removeAttachment(id: String) { _attachments.value = _attachments.value.filter { it.id != id } }

    fun sendMessage(content: String = _inputText.value) {
        val trimmed = content.trim()
        if (trimmed.isBlank() && _attachments.value.isEmpty()) return
        if (_isLoading.value) return

        val now = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
        val userMsg = ChatMessage(
            id = "msg_" + System.currentTimeMillis() + "_user",
            role = "user",
            content = trimmed,
            timestamp = now,
            attachments = _attachments.value
        )
        val assistantMsgId = "msg_" + System.currentTimeMillis() + "_assistant"
        val initialAssistantMsg = ChatMessage(
            id = assistantMsgId,
            role = "assistant",
            content = "",
            timestamp = now,
            status = "Analyzing prompt...",
            sandboxLogs = emptyList()
        )

        _messages.value = _messages.value + userMsg + initialAssistantMsg
        _inputText.value = ""
        _attachments.value = emptyList()
        _isLoading.value = true

        viewModelScope.launch {
            try {
                var currentAssistantMsg = initialAssistantMsg
                val accumulatedSandboxLogs = mutableListOf<SandboxExecutionLog>()

                repository.streamChat(
                    tenantId = _activeTenant.value.id,
                    systemInstruction = _activeTenant.value.systemInstruction,
                    messages = _messages.value.filter { it.id != assistantMsgId }
                ).collect { payload ->
                    when (payload.type) {
                        "status" -> {
                            currentAssistantMsg = currentAssistantMsg.copy(status = payload.message ?: payload.status)
                        }
                        "sandbox_result" -> {
                            payload.execution?.let { accumulatedSandboxLogs.add(it) }
                            currentAssistantMsg = currentAssistantMsg.copy(sandboxLogs = accumulatedSandboxLogs.toList())
                        }
                        "text" -> {
                            val newContent = payload.text ?: (currentAssistantMsg.content + (payload.chunk ?: ""))
                            currentAssistantMsg = currentAssistantMsg.copy(content = newContent, status = null)
                        }
                        "done" -> {
                            val finalContent = payload.text ?: currentAssistantMsg.content
                            currentAssistantMsg = currentAssistantMsg.copy(content = finalContent.ifBlank { "Execution completed." }, status = null)
                        }
                        "error" -> {
                            currentAssistantMsg = currentAssistantMsg.copy(content = payload.error ?: "Execution error.", status = null)
                        }
                    }
                    _messages.value = _messages.value.map { if (it.id == assistantMsgId) currentAssistantMsg else it }
                }
            } catch (e: Exception) {
                _messages.value = _messages.value.map {
                    if (it.id == assistantMsgId) it.copy(content = "Connection error. Please try again.", status = null) else it
                }
            } finally {
                _isLoading.value = false
            }
        }
    }
}
