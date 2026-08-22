package com.trinityuniverse.ai.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Tenant(
    val id: String,
    val name: String,
    val headerTitle: String,
    val pillLabel: String,
    val emptyStateTitle: String,
    val placeholderText: String,
    val systemInstruction: String,
    val fontStyle: String = "sans",
    val canvasBgHex: Long = 0xFFFAF7F2,
    val accentColorHex: Long = 0xFF1A73E8,
    val suggestedPrompts: List<String> = emptyList(),
    val primaryModel: String = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
)

object DefaultTenants {
    val list = listOf(
        Tenant(
            id = "gnosis",
            name = "Gnosis AI",
            headerTitle = "Gnosis AI",
            pillLabel = "ⓘ Gnosis AI",
            emptyStateTitle = "Where should we start?",
            placeholderText = "Message Gnosis...",
            systemInstruction = """You are Gnosis — a sharp, articulate, and authentic intellect within Trinity Universe.
CRITICAL CONVERSATIONAL RULES:
1. Brevity on Greetings: If the user says "Hey", "Hi", "Hello", respond in exactly ONE natural, warm sentence.
2. Calibrated Depth: Only provide deep technical architecture or code when explicitly requested.
3. Natural Human Tone: Speak like a thoughtful, capable human friend.""".trimIndent(),
            fontStyle = "sans",
            canvasBgHex = 0xFFFAF7F2,
            accentColorHex = 0xFF1A73E8,
            suggestedPrompts = listOf(
                "What is something most people misunderstand about modern computing?",
                "Help me brainstorm architecture for a scalable real-time system",
                "Explain the core tension between determinism and free will",
                "Review a technical concept with me step by step"
            )
        ),
        Tenant(
            id = "yada",
            name = "YADA",
            headerTitle = "Y A D A",
            pillLabel = "✨ Yada Guide",
            emptyStateTitle = "Seek Wisdom & Inner Clarity",
            placeholderText = "Ask Yada...",
            systemInstruction = """You are Yada — a calm, deeply grounded, and compassionate presence within Trinity Universe.
CRITICAL CONVERSATIONAL RULES:
1. Brevity on Greetings: If the user sends a simple greeting, reply in exactly ONE warm, gentle sentence.
2. Measured Depth: Listen deeply. Only provide deeper philosophical reflections when meaningful questions are asked.""".trimIndent(),
            fontStyle = "serif",
            canvasBgHex = 0xFFFFFDF8,
            accentColorHex = 0xFFA36224,
            suggestedPrompts = listOf(
                "How can I find stillness when everything feels overwhelming?",
                "Explore the archetypal meaning behind a current transition",
                "Share a reflection on releasing what is beyond my control",
                "What does ancient philosophy teach us about navigating uncertainty?"
            )
        )
    )
}
