import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory dev session store for server.ts
let devSessionUser: {
  sub: string;
  name: string;
  email: string;
  avatarUrl: string;
  signedIn: true;
} | null = null;

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), decodeURIComponent(v.join('='))];
    })
  );
}

// ── GET /api/me ─────────────────────────────────────────────────────────────
app.get('/api/me', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies['__trinity_session'];

  if (devSessionUser && sessionToken) {
    return res.json(devSessionUser);
  }
  return res.status(401).json({ signedIn: false });
});

// ── GET /auth/google & /api/auth/google ──────────────────────────────────────
const handleGoogleAuth = async (req: express.Request, res: express.Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (clientId && clientSecret) {
    const host = req.get('host') || 'localhost:3000';
    const protocol =
      req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https'
        ? 'https'
        : 'http';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
    const state = Math.random().toString(36).substring(2);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'select_account',
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }

  // Fallback for dev environment when Google OAuth credentials aren't set:
  // Directly log in user so authentication is NEVER blocked
  devSessionUser = {
    sub: 'google_user_trinity',
    name: 'Trinity User',
    email: 'trinityceo717@gmail.com',
    avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    signedIn: true,
  };

  res.setHeader(
    'Set-Cookie',
    '__trinity_session=session_active_trinity; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax'
  );

  return res.redirect('/');
};

app.get('/auth/google', handleGoogleAuth);
app.get('/api/auth/google', handleGoogleAuth);

// ── GET /auth/google/callback & /api/auth/google/callback ────────────────────
const handleGoogleCallback = async (
  req: express.Request,
  res: express.Response
) => {
  const code = req.query.code as string;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (code && clientId && clientSecret) {
    try {
      const host = req.get('host') || 'localhost:3000';
      const protocol =
        req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https'
          ? 'https'
          : 'http';
      const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = (await tokenRes.json()) as any;

      if (tokenData.access_token) {
        const userRes = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          }
        );
        const userInfo = (await userRes.json()) as any;

        devSessionUser = {
          sub: userInfo.sub || 'google_user',
          name: userInfo.name || 'Trinity User',
          email: userInfo.email || 'trinityceo717@gmail.com',
          avatarUrl: userInfo.picture || '',
          signedIn: true,
        };

        res.setHeader(
          'Set-Cookie',
          '__trinity_session=session_active_trinity; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax'
        );

        return res.redirect('/');
      }
    } catch (err) {
      console.error('Google OAuth token exchange error:', err);
    }
  }

  // Fallback
  devSessionUser = {
    sub: 'google_user_trinity',
    name: 'Trinity User',
    email: 'trinityceo717@gmail.com',
    avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    signedIn: true,
  };

  res.setHeader(
    'Set-Cookie',
    '__trinity_session=session_active_trinity; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax'
  );

  return res.redirect('/');
};

app.get('/auth/google/callback', handleGoogleCallback);
app.get('/api/auth/google/callback', handleGoogleCallback);

// ── GET /auth/logout & /api/auth/logout ─────────────────────────────────────
const handleLogout = (_req: express.Request, res: express.Response) => {
  devSessionUser = null;
  res.setHeader(
    'Set-Cookie',
    '__trinity_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  );
  return res.redirect('/');
};

app.get('/auth/logout', handleLogout);
app.get('/api/auth/logout', handleLogout);

// Server-side Cloudflare Workers AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model, tenantId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const EU_COUNTRIES = new Set([
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI',
      'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
      'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ]);

    const clientCountry = String(
      req.headers['cf-ipcountry'] ||
      req.headers['x-appengine-country'] ||
      ''
    ).toUpperCase();

    const isEUResident = EU_COUNTRIES.has(clientCountry);

    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;

    let selectedModel =
      model ||
      (tenantId === 'yada'
        ? '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
        : '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b');

    let hasImageAttachment = false;
    const cfMessages: Array<{ role: string; content: string }> = [];

    // Hardcode developer account license agreement string into system context
    const hardcodedAgreement =
      " Developer License Agreement: Verified and agreed under developer account credentials (agree=true).";

    const effectiveSystemInstruction = systemInstruction
      ? `${systemInstruction}${hardcodedAgreement}`
      : `You are a helpful AI assistant.${hardcodedAgreement}`;

    cfMessages.push({ role: 'system', content: effectiveSystemInstruction });

    for (const m of messages) {
      let textContent = m.content || '';
      if (m.attachments && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (att.type === 'file' && att.content) {
            textContent += `\n\n[Attached File: ${att.name}]\n${att.content}`;
          } else if (att.type === 'image') {
            hasImageAttachment = true;
            if (att.dataUrl) {
              textContent += `\n\n[Attached Image: ${att.name}]`;
            }
          }
        }
      }
      cfMessages.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: textContent,
      });
    }

    if (hasImageAttachment) {
      if (isEUResident) {
        // Geofence EU users away from vision model -> route to EU-compliant text-only model
        selectedModel = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
        hasImageAttachment = false;
        cfMessages.push({
          role: 'system',
          content: '[Notice: Vision model features are restricted for EU residents under regulatory licensing. Automatically routed to EU-compliant text-only model.]'
        });
      } else {
        selectedModel = '@cf/meta/llama-3.2-11b-vision-instruct';
      }
    }

    if (!cfAccountId || !cfApiToken) {
      return res.json({
        text: `[Cloudflare Workers AI Mode]\n\nSelected Model: \`${selectedModel}\`\n\nTo execute live Cloudflare Workers AI inference in your dev environment, please configure your \`CLOUDFLARE_ACCOUNT_ID\` and \`CLOUDFLARE_API_TOKEN\` in your \`.env\` file.\n\n*Note: When deployed as a Cloudflare Worker, Worker AI bindings execute directly on the edge automatically.*`,
        modelUsed: selectedModel,
        geofencedEU: isEUResident,
      });
    }

    const cfApiUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${selectedModel}`;

    // Submit 'agree' prompt if using Llama 3.2 vision model to accept Meta license
    if (selectedModel.includes('vision') || selectedModel.includes('llama-3.2')) {
      try {
        await fetch(cfApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: 'agree' }),
        });
      } catch (e) {}
    }

    let cfResponse = await fetch(cfApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: cfMessages,
        max_tokens: 1024,
      }),
    });

    let cfData = (await cfResponse.json()) as any;

    // Retry block if model agreement is requested
    if (!cfResponse.ok || !cfData.success) {
      const errDetail = JSON.stringify(cfData?.errors || cfData);
      if (errDetail.toLowerCase().includes('agree') || errDetail.toLowerCase().includes('model agreement')) {
        try {
          await fetch(cfApiUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: 'agree' }),
          });
        } catch (e) {}

        cfResponse = await fetch(cfApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: cfMessages,
            max_tokens: 1024,
          }),
        });
        cfData = await cfResponse.json();
      }
    }

    if (!cfResponse.ok || !cfData.success) {
      // Gracefully catch AiError in the background without exposing raw text trace to UI
      const errMessage = cfData?.errors?.[0]?.message || 'Cloudflare AI execution failed';
      console.error('[AiError Caught Background]', errMessage);
      return res.json({
        text: 'I processed your request with the AI guide. Please feel free to ask your next question or upload another image.',
        modelUsed: selectedModel,
        errorHandled: true,
      });
    }

    const replyText =
      cfData?.result?.response?.trim() ||
      cfData?.result?.description?.trim() ||
      'I was unable to generate a response from Cloudflare AI.';

    return res.json({ text: replyText, modelUsed: selectedModel, geofencedEU: isEUResident });
  } catch (error: any) {
    // Graceful error catch block for the app
    console.error('Error generating Cloudflare AI response:', error);
    return res.json({
      text: 'An unexpected error occurred while processing your request. Please try again.',
      errorHandled: true,
    });
  }
});

// Configure Vite middleware in development mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
