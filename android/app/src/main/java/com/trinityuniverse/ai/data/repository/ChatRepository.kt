package com.trinityuniverse.ai.data.repository

import com.trinityuniverse.ai.data.models.ChatMessage
import com.trinityuniverse.ai.data.models.StreamEventPayload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOn
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import java.util.concurrent.TimeUnit

class ChatRepository(
    private val baseUrl: String = "http://10.0.2.2:3000" // Android Emulator localhost bridge
) {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    fun streamChat(
        tenantId: String,
        systemInstruction: String,
        messages: List<ChatMessage>
    ): Flow<StreamEventPayload> = callbackFlow {
        val payloadObj = buildJsonObject {
            put("tenantId", tenantId)
            put("systemInstruction", systemInstruction)
            putJsonArray("messages") {
                messages.forEach { msg ->
                    add(buildJsonObject {
                        put("role", msg.role)
                        put("content", msg.content)
                    })
                }
            }
        }

        val request = Request.Builder()
            .url("$baseUrl/api/chat")
            .header("Accept", "text/event-stream")
            .header("Content-Type", "application/json")
            .post(payloadObj.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val factory = EventSources.createFactory(client)
        val eventSource = factory.newEventSource(request, object : EventSourceListener() {
            override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                if (data.isNotBlank()) {
                    try {
                        val parsed = json.decodeFromString<StreamEventPayload>(data)
                        trySend(parsed)
                    } catch (e: Exception) {
                        trySend(StreamEventPayload(type = "text", chunk = data))
                    }
                }
            }

            override fun onClosed(eventSource: EventSource) {
                close()
            }

            override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                trySend(StreamEventPayload(type = "error", error = t?.localizedMessage ?: "Connection error"))
                close(t)
            }
        })

        awaitClose {
            eventSource.cancel()
        }
    }.flowOn(Dispatchers.IO)
}
