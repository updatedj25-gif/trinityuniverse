import subprocess
import re

# 1. Restore clean original ChatScreen.kt
subprocess.run("git checkout android/app/src/main/java/com/trinityuniverse/ai/ui/screens/ChatScreen.kt", shell=True)

path = "android/app/src/main/java/com/trinityuniverse/ai/ui/screens/ChatScreen.kt"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# 2. Add clean imports below package declaration
extra_imports = """
import com.trinityuniverse.ai.data.repository.UpdateManager
import com.trinityuniverse.ai.data.repository.AppVersionInfo
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import androidx.compose.ui.platform.LocalContext
"""
code = code.replace("package com.trinityuniverse.ai.ui.screens\n", "package com.trinityuniverse.ai.ui.screens\n" + extra_imports)

# 3. Inject dialog right after the ChatScreen function signature opening brace
dialog_code = """
    val context = LocalContext.current
    val updateManager = remember { UpdateManager(context) }
    var availableUpdate by remember { mutableStateOf<AppVersionInfo?>(null) }

    LaunchedEffect(Unit) {
        availableUpdate = updateManager.checkForUpdates()
    }

    if (availableUpdate != null) {
        AlertDialog(
            onDismissRequest = { availableUpdate = null },
            title = { Text("Update Available", fontWeight = FontWeight.Bold) },
            text = { Text(availableUpdate?.releaseNotes ?: "A new version of Gnosis AI is ready.") },
            confirmButton = {
                TextButton(onClick = {
                    availableUpdate?.downloadUrl?.let { updateManager.startDownload(it) }
                    availableUpdate = null
                }) {
                    Text("Update Now")
                }
            },
            dismissButton = {
                TextButton(onClick = { availableUpdate = null }) {
                    Text("Later")
                }
            }
        )
    }
"""

# Regex match the full ChatScreen function signature up to its opening {
pattern = r'(fun\s+ChatScreen\s*\([^)]*\)\s*\{)'
match = re.search(pattern, code, re.DOTALL)
if match:
    sig = match.group(1)
    code = code.replace(sig, sig + "\n" + dialog_code, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Successfully patched ChatScreen.kt in the correct function body location.")
else:
    print("Could not match ChatScreen signature via regex.")
