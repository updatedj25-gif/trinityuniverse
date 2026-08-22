package com.trinityuniverse.ai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.trinityuniverse.ai.ui.theme.*

@Composable
fun ModelSelectorPills(
    selectedPill: String,
    onPillSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val pills = listOf(
        Triple("Instant", "✨", Color(0xFFF59E0B)),
        Triple("Expert", "💎", Color(0xFF3B82F6)),
        Triple("Vision", "👁️", Color(0xFF8B5CF6))
    )

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(999.dp))
            .background(Color(0xFFF5F5F4))
            .border(1.dp, Color(0xFFE7E5E4), RoundedCornerShape(999.dp))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        pills.forEach { (label, icon, _) ->
            val isSelected = selectedPill == label
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (isSelected) WhiteBubble else Color.Transparent)
                    .then(
                        if (isSelected) Modifier.border(1.dp, Color(0xFFE7E5E4), RoundedCornerShape(999.dp))
                        else Modifier
                    )
                    .clickable { onPillSelected(label) }
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(text = icon, fontSize = 12.sp)
                Text(
                    text = label,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isSelected) TextPrimary else TextSecondary
                )
            }
        }
    }
}
