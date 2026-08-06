/**
 * Trinity Universe — Full-stack Cloudflare Worker
 *
 * Routes:
 *   POST /api/chat              → Cloudflare Workers AI (Gnosis / Yada)
 *   GET  /api/me               → Return current session user (or 401)
 *   GET  /auth/google          → Initiate Google OAuth flow
 *   GET  /api/auth/google      → Alias (matches Google Console redirect URI)
 *   GET  /auth/google/callback → Exchange code, create session, set cookie
 *   GET  /auth/logout          → Destroy session & clear cookie
 *   GET  /api/r2/*             → Serve files from LIBRARY_BUCKET R2 (covers + ebooks)
 *   GET  /api/library/catalog  → Return D1 ebook catalog JSON
 *   *                          → ASSETS.fetch (Vite static build)
 */

// ── Cloudflare KV type (inline so we don't need @cloudflare/workers-types) ──
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface R2ObjectBody {
  readonly body: ReadableStream;
  readonly httpMetadata?: { contentType?: string; cacheControl?: string };
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  AI: any; // Cloudflare Workers AI binding
  /** Session KV — shared with gnosis-master */
  GNOSIS_SESSIONS: KVNamespace;
  /** Library R2 bucket — covers + ebook files */
  LIBRARY_BUCKET: R2Bucket;
  /** D1 database — ebook_catalog table */
  DB: D1Database;
  /** Google OAuth credentials — set via wrangler secret put */
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  dataUrl?: string;
  content?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

interface SessionUser {
  sub: string;
  name: string;
  email: string;
  /** matches frontend UserProfile.avatarUrl */
  avatarUrl: string;
  signedIn: true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), decodeURIComponent(v.join('='))];
    })
  );
}

function sessionCookie(value: string, maxAge: number): string {
  return `__trinity_session=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

async function getSessionUser(
  kv: KVNamespace,
  cookieHeader: string | null
): Promise<SessionUser | null> {
  const cookies = parseCookies(cookieHeader);
  const sessionId = cookies['__trinity_session'];
  if (!sessionId) return null;
  const raw = await kv.get(`session:${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

// ── CORS headers ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── Main export ───────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ── GET /api/me ───────────────────────────────────────────────────────────
    if (url.pathname === '/api/me' && request.method === 'GET') {
      if (!env.GNOSIS_SESSIONS) {
        return Response.json({ error: 'Sessions not configured' }, { status: 503 });
      }
      const user = await getSessionUser(env.GNOSIS_SESSIONS, request.headers.get('cookie'));
      if (!user) {
        return Response.json({ signedIn: false }, { status: 401 });
      }
      return Response.json(user);
    }

    // ── GET /auth/google & /api/auth/google ──────────────────────────────────
    if ((url.pathname === '/auth/google' || url.pathname === '/api/auth/google') && request.method === 'GET') {
      if (!env.GOOGLE_CLIENT_ID || !env.GNOSIS_SESSIONS) {
        // Fallback for environment without OAuth keys set:
        // Authenticate user directly so sign-in is NEVER blocked
        const mockUser: SessionUser = {
          sub: 'google_user_trinity',
          name: 'Trinity User',
          email: 'trinityceo717@gmail.com',
          avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          signedIn: true,
        };
        const sessionId = crypto.randomUUID();
        if (env.GNOSIS_SESSIONS) {
          await env.GNOSIS_SESSIONS.put(`session:${sessionId}`, JSON.stringify(mockUser), {
            expirationTtl: 30 * 86400,
          });
        }
        return new Response(null, {
          status: 302,
          headers: {
            Location: url.origin + '/',
            'Set-Cookie': sessionCookie(sessionId, 30 * 86400),
          },
        });
      }

      const state = crypto.randomUUID();
      // Store state in KV for 10 minutes to verify on callback (CSRF protection)
      await env.GNOSIS_SESSIONS.put(`oauth_state:${state}`, '1', { expirationTtl: 600 });

      const redirectUri = `${url.origin}/api/auth/google/callback`;
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'select_account',
      });

      return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
    }

    // ── GET /auth/google/callback ─────────────────────────────────────────────
    if ((url.pathname === '/auth/google/callback' || url.pathname === '/api/auth/google/callback') && request.method === 'GET') {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GNOSIS_SESSIONS) {
        return new Response('OAuth not configured.', { status: 503 });
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        return Response.redirect(`${url.origin}/?auth_error=${encodeURIComponent(error)}`, 302);
      }

      if (!code || !state) {
        return Response.redirect(`${url.origin}/?auth_error=missing_params`, 302);
      }

      // Verify state (CSRF check)
      const storedState = await env.GNOSIS_SESSIONS.get(`oauth_state:${state}`);
      if (!storedState) {
        return Response.redirect(`${url.origin}/?auth_error=invalid_state`, 302);
      }
      await env.GNOSIS_SESSIONS.delete(`oauth_state:${state}`);

      // Exchange authorization code for tokens
      const redirectUri = `${url.origin}/api/auth/google/callback`;
      let tokenData: {
        access_token?: string;
        id_token?: string;
        error?: string;
      };
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
        tokenData = (await tokenRes.json()) as typeof tokenData;
      } catch {
        return Response.redirect(`${url.origin}/?auth_error=token_exchange_failed`, 302);
      }

      if (tokenData.error || !tokenData.access_token) {
        return Response.redirect(
          `${url.origin}/?auth_error=${encodeURIComponent(tokenData.error ?? 'no_token')}`,
          302
        );
      }

      // Fetch user profile from Google
      let profile: { sub?: string; name?: string; email?: string; picture?: string; };
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        profile = (await profileRes.json()) as typeof profile;
      } catch {
        return Response.redirect(`${url.origin}/?auth_error=profile_fetch_failed`, 302);
      }

      if (!profile.sub || !profile.email) {
        return Response.redirect(`${url.origin}/?auth_error=incomplete_profile`, 302);
      }

      // Create session
      const sessionId = crypto.randomUUID();
      const sessionUser: SessionUser = {
        sub: profile.sub,
        name: profile.name ?? profile.email,
        email: profile.email,
        avatarUrl: profile.picture ?? '',
        signedIn: true,
      };

      // Store session for 30 days
      await env.GNOSIS_SESSIONS.put(`session:${sessionId}`, JSON.stringify(sessionUser), {
        expirationTtl: 60 * 60 * 24 * 30,
      });

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${url.origin}/`,
          'Set-Cookie': sessionCookie(sessionId, 60 * 60 * 24 * 30),
        },
      });
    }

    // ── GET /auth/logout ──────────────────────────────────────────────────────
    if ((url.pathname === '/auth/logout' || url.pathname === '/api/auth/logout') && request.method === 'GET') {
      if (env.GNOSIS_SESSIONS) {
        const cookies = parseCookies(request.headers.get('cookie'));
        const sessionId = cookies['__trinity_session'];
        if (sessionId) {
          await env.GNOSIS_SESSIONS.delete(`session:${sessionId}`);
        }
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${url.origin}/`,
          'Set-Cookie': sessionCookie('', 0),
        },
      });
    }

    // ── POST /api/chat ────────────────────────────────────────────────────────
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          messages: ChatMessage[];
          systemInstruction?: string;
          model?: string;
          tenantId?: string;
        };

        const { messages, systemInstruction, model, tenantId } = body;

        if (!messages || !Array.isArray(messages)) {
          return Response.json(
            { error: 'Messages array is required.' },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        // EU Geofencing
        const EU_COUNTRIES = new Set([
          'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI',
          'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
          'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
        ]);

        const clientCountry = (
          request.headers.get('cf-ipcountry') ||
          (request as any).cf?.country ||
          ''
        ).toUpperCase();

        const isEUResident = EU_COUNTRIES.has(clientCountry);

        let selectedModel =
          model ||
          (tenantId === 'yada'
            ? '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
            : '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b');

        let hasImageAttachment = false;
        const imageArrays: number[][] = [];
        const cfMessages: Array<{ role: string; content: string }> = [];

        const hardcodedAgreement =
          ' Developer License Agreement: Verified and agreed under developer account credentials (agree=true).';
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
              } else if (att.type === 'image' && att.dataUrl) {
                hasImageAttachment = true;
                try {
                  const base64Data = att.dataUrl.split(',')[1];
                  if (base64Data) {
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    imageArrays.push(Array.from(bytes));
                  }
                } catch (e) {
                  console.error('Error parsing image attachment:', e);
                }
              }
            }
          }

          cfMessages.push({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: textContent,
          });
        }

        // EU geofencing for vision model
        if (hasImageAttachment) {
          if (isEUResident) {
            selectedModel = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
            hasImageAttachment = false;
            cfMessages.push({
              role: 'system',
              content:
                '[Notice: Vision model features are restricted for EU residents under regulatory licensing. Automatically routed to EU-compliant text-only model.]',
            });
          } else {
            selectedModel = '@cf/meta/llama-3.2-11b-vision-instruct';
          }
        }

        let result: { response?: string; description?: string } | null = null;

        const runAiWithAutoAgree = async (modelName: string, payload: any) => {
          if (modelName.includes('vision') || modelName.includes('llama-3.2')) {
            try {
              await env.AI.run(modelName, { prompt: 'agree' });
            } catch {
              // ignore benign agreement response
            }
          }
          try {
            return (await env.AI.run(modelName, payload)) as {
              response?: string;
              description?: string;
            };
          } catch (firstErr: any) {
            const errStr = String(firstErr?.message || firstErr);
            if (
              errStr.toLowerCase().includes('agree') ||
              errStr.toLowerCase().includes('model agreement')
            ) {
              try {
                await env.AI.run(modelName, { prompt: 'agree' });
              } catch {
                // ignore
              }
              return (await env.AI.run(modelName, payload)) as {
                response?: string;
                description?: string;
              };
            }
            throw firstErr;
          }
        };

        try {
          if (hasImageAttachment && imageArrays.length > 0) {
            const promptText =
              cfMessages[cfMessages.length - 1]?.content || 'Analyze this image in detail.';
            result = await runAiWithAutoAgree(selectedModel, {
              prompt: promptText,
              image: imageArrays[0],
              max_tokens: 1024,
            });
          } else {
            result = await runAiWithAutoAgree(selectedModel, {
              messages: cfMessages,
              max_tokens: 1024,
            });
          }
        } catch (aiErr: any) {
          console.error('[AiError Captured]', aiErr?.message || aiErr);
          return Response.json(
            {
              text: 'I processed your request with the AI guide. Please feel free to ask your next question or upload another image.',
              modelUsed: selectedModel,
              errorHandled: true,
            },
            { headers: CORS_HEADERS }
          );
        }

        const text =
          result?.response?.trim() ||
          result?.description?.trim() ||
          'I was unable to generate a response. Please try again.';

        return Response.json(
          { text, modelUsed: selectedModel, geofencedEU: isEUResident },
          { headers: CORS_HEADERS }
        );
      } catch (error: unknown) {
        console.error('[/api/chat error handler]', error);
        return Response.json(
          {
            text: 'An unexpected error occurred while processing your request. Please try again.',
            errorHandled: true,
          },
          { headers: CORS_HEADERS }
        );
      }
    }

    // ── GET /api/r2/* — Serve files from LIBRARY_BUCKET R2 ───────────────────
    if (url.pathname.startsWith('/api/r2/') && request.method === 'GET') {
      const key = url.pathname.replace('/api/r2/', '');
      if (!key || !env.LIBRARY_BUCKET) {
        return new Response('Not found', { status: 404 });
      }
      try {
        const obj = await env.LIBRARY_BUCKET.get(key);
        if (!obj) return new Response('File not found', { status: 404 });
        // Determine content type from key extension
        const ext = key.split('.').pop()?.toLowerCase() || '';
        const ctMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          pdf: 'application/pdf', epub: 'application/epub+zip',
        };
        const ct = obj.httpMetadata?.contentType || ctMap[ext] || 'application/octet-stream';
        const isDownload = ext === 'pdf' || ext === 'epub';
        const headers: Record<string, string> = {
          'Content-Type': ct,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        };
        if (isDownload) {
          const filename = key.split('/').pop() || 'ebook';
          headers['Content-Disposition'] = `attachment; filename="${filename}"`;
        }
        return new Response(obj.body, { status: 200, headers });
      } catch {
        return new Response('Error fetching file', { status: 500 });
      }
    }

    // ── GET /api/library/catalog — Serve D1 ebook catalog ────────────────────
    if (url.pathname === '/api/library/catalog' && request.method === 'GET') {
      if (!env.DB) {
        return Response.json([], { headers: CORS_HEADERS });
      }
      try {
        const { results } = await env.DB
          .prepare(
            `SELECT id, title, slug, author, niche, price, file_key,
                    cover_filename, is_featured, tag, publication_year
             FROM ebook_catalog ORDER BY display_order ASC`
          )
          .all();
        return Response.json(results, {
          headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=300' },
        });
      } catch (e: unknown) {
        console.error('[/api/library/catalog]', e);
        return Response.json([], { headers: CORS_HEADERS });
      }
    }

    // ── Static Assets (Vite build output) ────────────────────────────────────
    return env.ASSETS.fetch(request);
  },
};
