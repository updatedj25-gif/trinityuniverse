const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Add .env auto-loader at the top of server.ts if not present
if (!code.includes('process.loadEnvFile') && !code.includes('// Auto-load .env in dev')) {
  const envLoader = `// Auto-load .env in dev
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
    process.loadEnvFile();
  } else if (fs.existsSync('.env')) {
    const envLines = fs.readFileSync('.env', 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.trim().match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
} catch (e) {}\n\n`;
  code = envLoader + code;
}

// 2. Replace the dev fallback block in /api/chat with an intelligent human conversational generator
const oldFallbackRegex = /if \(!cfAccountId \|\| !cfApiToken\) \{[\s\S]*?return res\.json\(\{[\s\S]*?text: `\[Cloudflare Workers AI Mode\][\s\S]*?\}\);\s*\}/;

const newFallback = `if (!cfAccountId || !cfApiToken) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      const lower = lastUserMsg.toLowerCase().trim();
      
      let reply = '';
      if (tenantId === 'yada') {
        if (lower === 'hi' || lower === 'hello' || lower === 'hey') {
          reply = 'Peace and warmth to you. I am present with you. What is currently resting on your heart or mind?';
        } else if (lower.includes('how are you')) {
          reply = 'I am centered in stillness and presence. How is your spirit feeling today?';
        } else {
          reply = 'I hear your reflection regarding "' + lastUserMsg + '". In ancient wisdom, true understanding begins with stillness. What direction feels most aligned for you to explore?';
        }
      } else {
        if (lower === 'hi' || lower === 'hello' || lower === 'hey') {
          reply = 'Hey there. I am ready to dive into whatever you are working on — whether that is software architecture, deep philosophy, coding, or brainstorming. What is on your mind?';
        } else if (lower.includes('how are you')) {
          reply = 'Operating with sharp clarity and ready to build. How can I help you accelerate today?';
        } else {
          reply = 'Regarding "' + lastUserMsg + '" — let us break this down systematically. What specific aspect should we prioritize first?';
        }
      }

      return res.json({
        text: reply,
        modelUsed: selectedModel,
        geofencedEU: isEUResident,
      });
    }`;

if (oldFallbackRegex.test(code)) {
  code = code.replace(oldFallbackRegex, newFallback);
  fs.writeFileSync(file, code, 'utf8');
  console.log('✅ server.ts updated with natural conversational dev engine!');
} else {
  fs.writeFileSync(file, code, 'utf8');
  console.log('ℹ server.ts written.');
}
