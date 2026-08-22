package com.trinityuniverse.ai.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Attachment(
    val id: String,
    val name: String,
    val type: String, // "image" | "file"
    val url: String,
    val dataUrl: String? = null
)

@Serializable
data class SandboxExecutionLog(
    val code: String? = null,
    val language: String? = null,
    val stdout: String? = null,
    val stderr: String? = null,
    val error: String? = null,
    val success: Boolean? = true
)

@Serializable
data class ChatMessage(
    val id: String,
    val role: String, // "user" | "assistant" | "system"
    val content: String,
    val timestamp: String,
    val attachments: List<Attachment> = emptyList(),
    val status: String? = null,
    val sandboxLogs: List<SandboxExecutionLog> = emptyList()
)

@Serializable
data class ChatSession(
    val id: String,
    val tenantId: String,
    val title: String,
    val createdAt: String,
    val updatedAt: String,
    val messages: List<ChatMessage> = emptyList()
)

@Serializable
data class StreamEventPayload(
    val type: String? = null,
    val status: String? = null,
    val message: String? = null,
    val chunk: String? = null,
    val text: String? = null,
    val execution: SandboxExecutionLog? = null,
    val error: String? = null
)
