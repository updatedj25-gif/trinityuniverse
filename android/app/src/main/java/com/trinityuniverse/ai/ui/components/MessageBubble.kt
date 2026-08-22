package com.trinityuniverse.ai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.trinityuniverse.ai.data.models.ChatMessage
import com.trinityuniverse.ai.data.models.Tenant
import com.trinityuniverse.ai.ui.theme.*

@Composable
fun MessageBubble(
    message: ChatMessage,
    tenant: Tenant,
    modifier: Modifier = Modifier
) {
    val isUser = message.role == "user"
    val accentColor = Color(tenant.accentColorHex)

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Top
    ) {
        // Assistant Avatar
        if (!isUser) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(accentColor),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.SmartToy,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        Column(
            modifier = Modifier.weight(1f, fill = false),
            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
        ) {
            // Live Status Badge
            if (!message.status.isNullOrBlank()) {
                Row(
                    modifier = Modifier
                        .padding(bottom = 6.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(AmberStatusBg)
                        .border(1.dp, AmberStatusBorder, RoundedCornerShape(999.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Bolt,
                        contentDescription = null,
                        tint = AmberStatusText,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = message.status,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = AmberStatusText
                    )
                }
            }

            // Sandbox Logs
            message.sandboxLogs.forEach { log ->
                SandboxExecutionWidget(
                    log = log,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            // Message Bubble Text
            if (message.content.isNotBlank()) {
                val bubbleShape = if (isUser) {
                    RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 2.dp)
                } else {
                    RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 2.dp, bottomEnd = 16.dp)
                }

                val bubbleBg = if (isUser) accentColor else WhiteBubble
                val textColor = if (isUser) Color.White else TextPrimary

                Box(
                    modifier = Modifier
                        .clip(bubbleShape)
                        .background(bubbleBg)
                        .then(
                            if (!isUser) Modifier.border(1.dp, CardBorder, bubbleShape)
                            else Modifier
                        )
                        .padding(horizontal = 14.dp, vertical = 10.dp)
                ) {
                    Text(
                        text = message.content,
                        fontSize = 13.sp,
                        lineHeight = 20.sp,
                        fontFamily = if (tenant.fontStyle == "serif") FontFamily.Serif else FontFamily.SansSerif,
                        color = textColor
                    )
                }
            }
        }

        // User Avatar
        if (isUser) {
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFE7E5E4)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = TextSecondary,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
