package com.trinityuniverse.ai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.Terminal
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
import com.trinityuniverse.ai.data.models.SandboxExecutionLog
import com.trinityuniverse.ai.ui.theme.*

@Composable
fun SandboxExecutionWidget(
    log: SandboxExecutionLog,
    modifier: Modifier = Modifier
) {
    val isSuccess = log.success != false

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(TerminalBg)
            .border(1.dp, TerminalBorder, RoundedCornerShape(12.dp))
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(TerminalHeader)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Terminal,
                    contentDescription = null,
                    tint = Color(0xFF34D399),
                    modifier = Modifier.size(14.dp)
                )
                Text(
                    text = "E2B Sandbox (${log.language ?: "python"})",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFFE2E8F0)
                )
            }

            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (isSuccess) TerminalSuccessBg else TerminalErrorBg)
                    .padding(horizontal = 8.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = if (isSuccess) Icons.Default.CheckCircle else Icons.Default.Warning,
                    contentDescription = null,
                    tint = if (isSuccess) TerminalSuccessText else TerminalErrorText,
                    modifier = Modifier.size(10.dp)
                )
                Text(
                    text = if (isSuccess) "Passed" else "Runtime Error",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isSuccess) TerminalSuccessText else TerminalErrorText
                )
            }
        }

        // Executed Code
        if (!log.code.isNullOrBlank()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TerminalCodeBg)
                    .padding(10.dp)
            ) {
                Text(
                    text = "EXECUTED CODE",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    letterSpacing = 0.5.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = log.code,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFFCBD5E1),
                    modifier = Modifier.horizontalScroll(rememberScrollState())
                )
            }
        }

        // Terminal Output
        val outputText = log.stdout ?: log.stderr ?: log.error
        if (!outputText.isNullOrBlank()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(10.dp)
            ) {
                Text(
                    text = "TERMINAL OUTPUT",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    letterSpacing = 0.5.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = outputText,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    color = if (isSuccess) TerminalStdoutText else TerminalStderrText,
                    modifier = Modifier.horizontalScroll(rememberScrollState())
                )
            }
        }
    }
}
