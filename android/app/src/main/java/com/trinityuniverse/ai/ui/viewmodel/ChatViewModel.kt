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

    fun selectTenant(tenant: Tenant) {
        _activeTenant.value = tenant
        _messages.value = emptyList()
    }

    fun setInputText(text: String) {
        _inputText.value = text
    }

    fun setSelectedPill(pill: String) {
        _selectedPill.value = pill
    }

    fun removeAttachment(id: String) {
        _attachments.value = _attachments.value.filter { it.id != id }
    }

    fun sendMessage(content: String = _inputText.value) {
        val trimmed = content.trim()
        if (trimmed.isBlank() && _attachments.value.isEmpty()) return
        if (_isLoading.value) return

        val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date())

        val userMessage = ChatMessage(
            id = "msg_${System.currentTimeMillis()}_user",
            role = "user",
            content = trimmed,
            timestamp = now,
            attachments = _attachments.value
        )

        val assistantMessageId = "msg_${System.currentTimeMillis()}_assistant"
        val initialAssistantMessage = ChatMessage(
            id = assistantMessageId,
            role = "assistant",
            content = "",
            timestamp = now,
            status = "Analyzing prompt..."
        )

        _messages.value = _messages.value + userMessage + initialAssistantMessage
        _inputText.value = ""
        _attachments.value = emptyList()
        _isLoading.value = true

        viewModelScope.launch {
            try {
                var accumulatedText = ""
                val currentLogs = mutableListOf<SandboxExecutionLog>()

                repository.streamChat(
                    tenantId = _activeTenant.value.id,
                    systemInstruction = _activeTenant.value.systemInstruction,
                    messages = _messages.value.filter { it.id != assistantMessageId }
                ).collect { payload ->
                    when (payload.type) {
                        "status" -> {
                            updateAssistantMessage(assistantMessageId) {
                                it.copy(status = payload.message ?: payload.status)
                            }
                        }
                        "sandbox_result" -> {
                            payload.execution?.let { currentLogs.add(it) }
                            updateAssistantMessage(assistantMessageId) {
                                it.copy(sandboxLogs = currentLogs.toList())
                            }
                        }
                        "text" -> {
                            accumulatedText = payload.text ?: (accumulatedText + (payload.chunk ?: ""))
                            updateAssistantMessage(assistantMessageId) {
                                it.copy(content = accumulatedText, status = null)
                            }
                        }
                        "done" -> {
                            accumulatedText = payload.text ?: accumulatedText
                            updateAssistantMessage(assistantMessageId) {
                                it.copy(content = accumulatedText.ifBlank { "Execution completed." }, status = null)
                            }
                        }
                        "error" -> {
                            val errorText = payload.error ?: "Error during generation"
                            updateAssistantMessage(assistantMessageId) {
                                it.copy(content = errorText, status = null)
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                updateAssistantMessage(assistantMessageId) {
                    it.copy(content = "Connection error: ${e.localizedMessage}", status = null)
                }
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun updateAssistantMessage(id: String, transform: (ChatMessage) -> ChatMessage) {
        _messages.value = _messages.value.map { if (it.id == id) transform(it) else it }
    }
}
