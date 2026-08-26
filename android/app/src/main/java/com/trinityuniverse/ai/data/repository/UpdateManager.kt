package com.trinityuniverse.ai.data.repository

import android.content.Context
import android.content.Intent
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request

@Serializable
data class AppVersionInfo(
    val versionCode: Int,
    val versionName: String,
    val downloadUrl: String,
    val releaseNotes: String? = null
)

class UpdateManager(private val context: Context) {
    private val client = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true }
    private val currentVersionCode = 1

    suspend fun checkForUpdates(baseUrl: String = "https://trinityuniverse-frontend.updatedj25.workers.dev"): AppVersionInfo? {
        return withContext(Dispatchers.IO) {
            try {
                val request = Request.Builder()
                    .url("$baseUrl/api/version")
                    .get()
                    .build()
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: return@withContext null
                        val info = json.decodeFromString<AppVersionInfo>(body)
                        if (info.versionCode > currentVersionCode) {
                            return@withContext info
                        }
                    }
                }
            } catch (_: Exception) {}
            null
        }
    }

    fun startDownload(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (_: Exception) {}
    }
}
