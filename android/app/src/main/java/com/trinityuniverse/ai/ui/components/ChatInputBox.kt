package com.trinityuniverse.ai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.trinityuniverse.ai.data.models.Attachment
import com.trinityuniverse.ai.data.models.Tenant
import com.trinityuniverse.ai.ui.theme.*

@Composable
fun ChatInputBox(
    text: String,
    onTextChange: (String) -> Unit,
    attachments: List<Attachment>,
    onRemoveAttachment: (String) -> Unit,
    onAttachClick: () -> Unit,
    onSendClick: () -> Unit,
    isLoading: Boolean,
    tenant: Tenant,
    modifier: Modifier = Modifier
) {
    val isSendActive = (text.isNotBlank() || attachments.isNotEmpty()) && !isLoading
    val sendButtonBg = if (isSendActive) {
        Color(tenant.accentColorHex)
    } else {
        Color(0xFFD6D3D1)
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(InputSurface)
            .border(1.dp, InputBorder, RoundedCornerShape(24.dp))
            .padding(12.dp)
    ) {
        // Attachment preview chips
        if (attachments.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                attachments.forEach { att ->
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(InputChipBg)
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AttachFile,
                            contentDescription = null,
                            tint = TextSecondary,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = att.name,
                            fontSize = 11.sp,
                            color = TextPrimary,
                            maxLines = 1
                        )
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Remove",
                            tint = TextMuted,
                            modifier = Modifier
                                .size(12.dp)
                                .clickable { onRemoveAttachment(att.id) }
                        )
                    }
                }
            }
        }

        // Clean borderless text area
        BasicTextField(
            value = text,
            onValueChange = onTextChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            textStyle = TextStyle(
                fontSize = 14.sp,
                color = TextPrimary,
                lineHeight = 20.sp
            ),
            decorationBox = { innerTextField ->
                if (text.isEmpty()) {
                    Text(
                        text = tenant.placeholderText.ifBlank { "Ask ${tenant.name} anything..." },
                        fontSize = 14.sp,
                        color = TextMuted
                    )
                }
                innerTextField()
            }
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Action Toolbar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Upload (+) button
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFE7E5E4))
                        .clickable { onAttachClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Attach file",
                        tint = Color(0xFF44403C),
                        modifier = Modifier.size(16.dp)
                    )
                }

                // Knowledge Chip Button
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color(0xFFE7E5E4))
                        .clickable { /* Knowledge library */ }
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.AutoStories,
                        contentDescription = null,
                        tint = Color(0xFF57534E),
                        modifier = Modifier.size(13.dp)
                    )
                    Text(
                        text = "Knowledge",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF44403C)
                    )
                }
            }

            // Send Button
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(sendButtonBg)
                    .clickable(enabled = isSendActive) { onSendClick() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.ArrowUpward,
                    contentDescription = "Send",
                    tint = if (isSendActive) Color.White else Color(0xFF78716C),
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
