package com.trinityuniverse.ai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.trinityuniverse.ai.data.models.ChatSession
import com.trinityuniverse.ai.data.models.Tenant
import com.trinityuniverse.ai.ui.theme.*

@Composable
fun AppDrawer(
    tenant: Tenant,
    sessions: List<ChatSession>,
    activeSessionId: String?,
    currentView: String,
    onSelectSession: (String) -> Unit,
    onNewSession: () -> Unit,
    onOpenLibrary: () -> Unit,
    onOpenFaceSwap: () -> Unit,
    onClearHistory: () -> Unit,
    onDeleteSession: (String) -> Unit,
    onCloseDrawer: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isYada = tenant.id == "yada"
    val accentColor = Color(tenant.accentColorHex)

    Column(
        modifier = modifier
            .fillMaxHeight()
            .width(300.dp)
            .background(Color(0xFFF6F3EE))
            .padding(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = tenant.name,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = if (isYada) FontFamily.Serif else FontFamily.SansSerif,
                color = if (isYada) Color(0xFFA36224) else TextPrimary
            )
            IconButton(onClick = onCloseDrawer) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Close Drawer",
                    tint = TextSecondary
                )
            }
        }

        // Action 1: Face Swap Studio
        val isFaceSwapActive = currentView == "faceswap"
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(if (isFaceSwapActive) Color(0xFF2563EB) else Color.White)
                .border(
                    1.dp,
                    if (isFaceSwapActive) Color(0xFF1D4ED8) else if (isYada) Color(0xFFE5C9A8) else CardBorder,
                    RoundedCornerShape(12.dp)
                )
                .clickable {
                    onOpenFaceSwap()
                    onCloseDrawer()
                }
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = null,
                tint = if (isFaceSwapActive) Color(0xFFFBBF24) else Color(0xFFF59E0B),
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Face Swap Studio",
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (isFaceSwapActive) Color.White else if (isYada) Color(0xFFA36224) else TextPrimary
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Action 2: Ebook Library
        val isLibraryActive = currentView == "library"
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(if (isLibraryActive) Color(0xFFA36224) else Color.White)
                .border(
                    1.dp,
                    if (isLibraryActive) Color(0xFF8A511D) else if (isYada) Color(0xFFE5C9A8) else CardBorder,
                    RoundedCornerShape(12.dp)
                )
                .clickable {
                    onOpenLibrary()
                    onCloseDrawer()
                }
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.AutoStories,
                contentDescription = null,
                tint = if (isLibraryActive) Color.White else if (isYada) Color(0xFFA36224) else TextPrimary,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Ebook Library",
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (isLibraryActive) Color.White else if (isYada) Color(0xFFA36224) else TextPrimary
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Action 3: New Chat
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(if (isYada) Color(0xFFA36224) else Color(0xFF0F172A))
                .clickable {
                    onNewSession()
                    onCloseDrawer()
                }
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isYada) "New Consultation" else "New Conversation",
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
        HorizontalDivider(color = Color(0xFFE7E5E4))
        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "CONVERSATIONS",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = TextSecondary,
            letterSpacing = 1.sp
        )

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            val tenantSessions = sessions.filter { it.tenantId == tenant.id }
            if (tenantSessions.isEmpty()) {
                item {
                    Text(
                        text = "No previous conversations",
                        fontSize = 12.sp,
                        color = TextMuted,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            } else {
                items(tenantSessions, key = { it.id }) { s ->
                    val isSelected = s.id == activeSessionId && currentView == "chat"
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) WhiteBubble else Color.Transparent)
                            .border(
                                1.dp,
                                if (isSelected) CardBorder else Color.Transparent,
                                RoundedCornerShape(10.dp)
                            )
                            .clickable {
                                onSelectSession(s.id)
                                onCloseDrawer()
                            }
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ChatBubbleOutline,
                                contentDescription = null,
                                tint = if (isSelected) accentColor else TextSecondary,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = s.title.ifBlank { "Conversation" },
                                fontSize = 12.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                color = if (isSelected) TextPrimary else TextSecondary
                            )
                        }

                        IconButton(
                            onClick = { onDeleteSession(s.id) },
                            modifier = Modifier.size(20.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.DeleteOutline,
                                contentDescription = "Delete Session",
                                tint = TextMuted,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }
            }
        }

        HorizontalDivider(color = Color(0xFFE7E5E4))
        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .clickable { onClearHistory() }
                .padding(vertical = 8.dp, horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.DeleteSweep,
                contentDescription = null,
                tint = Color(0xFFDC2626),
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isYada) "Clear Reflections" else "Clear History",
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFFDC2626)
            )
        }
    }
}
