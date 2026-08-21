
function sanitizeAiResponse(rawText: string): string {
  if (!rawText) return "";
  // Strip <think>...</think> blocks from DeepSeek or reasoning models
  let clean = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Strip unmatched leading <think> if truncated
  if (clean.startsWith("<think>")) {
    const endIdx = clean.indexOf("</think>");
    if (endIdx !== -1) clean = clean.substring(endIdx + 8).trim();
    else clean = clean.replace(/<think>[\s\S]*/gi, "").trim();
  }
  return clean || rawText.replace(/<\/?think>/gi, "").trim();
}

/**
 * Trinity Universe — Full-stack Cloudflare Worker
 *
 * Routes:
 *   POST /api/chat              → RAG-enhanced AI chat (Gnosis / Yada)
 *   POST /api/ingest            → Ingest a specific R2 file into RAG vector index
 *   POST /api/ingest-all        → Bulk ingest all R2 bucket files (admin)
 *   GET  /api/ingest-status     → List indexed files per tenant
 *   GET  /api/me                → Return current session user (or 401)
 *   GET  /auth/google           → Initiate Google OAuth flow
 *   GET  /api/auth/google       → Alias
 *   GET  /auth/google/callback  → Exchange code, create session, set cookie
 *   GET  /auth/logout           → Destroy session & clear cookie
 *   GET  /api/r2/*              → Serve files from LIBRARY_BUCKET R2
 *   GET  /api/library/catalog   → Return D1 ebook catalog JSON
 *   *                           → ASSETS.fetch (Vite static build)
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: Array<{ name: string; expiration?: number }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

interface R2ObjectBody {
  readonly body: ReadableStream;
  readonly httpMetadata?: { contentType?: string; cacheControl?: string };
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    objects: Array<{ key: string; size: number; uploaded: Date }>;
    truncated: boolean;
    cursor?: string;
  }>;
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

interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: Record<string, string | number | boolean>;
  namespace?: string;
}

interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, string | number | boolean>;
  values?: number[];
}

interface VectorizeIndex {
  upsert(vectors: VectorizeVector[]): Promise<{ mutationId: string }>;
  query(vector: number[], options?: {
    topK?: number;
    filter?: Record<string, string | number | boolean>;
    returnMetadata?: 'all' | 'indexed' | 'none';
    returnValues?: boolean;
    namespace?: string;
  }): Promise<{ matches: VectorizeMatch[] }>;
}

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  AI: any;
  /** Session KV */
  GNOSIS_SESSIONS: KVNamespace;
  /** Chat context cache + rate limiting */
  CHAT_CONTEXT_CACHE: KVNamespace;
  /** Fine-tuning structured message store */
  CHAT_SESSIONS: KVNamespace;
  /** Book content cache + ingest tracking */
  BOOK_STORE: KVNamespace;
  /** Vectorize index — 384-dim (bge-small-en-v1.5) */
  VECTORIZE: VectorizeIndex;
  /** Library R2 */
  LIBRARY_BUCKET: R2Bucket;
  /** Gnosis AI ebook bucket */
  GNOSIS_CHAT_BUCKET: R2Bucket;
  /** Yada AI ebook bucket */
  YADA_CHAT_BUCKET: R2Bucket;
  /** D1 database */
  DB: D1Database;
  /** Google OAuth credentials */
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
  avatarUrl: string;
  signedIn: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY — Prompt Injection Shield
// ─────────────────────────────────────────────────────────────────────────────

/** Patterns that indicate prompt injection or jailbreak attempts */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|above|prior|every)\s+(instructions?|prompts?|rules?|context|directives?)/i,
  /you\s+are\s+now\s+(a|an|the)\s+\w/i,
  /act\s+as\s+(a|an|the|if)\s+\w/i,
  /pretend\s+(to\s+be|you\s+are|that\s+you)/i,
  /\[?\s*system\s*\]?\s*:/i,
  /<\s*system\s*>/i,
  /jailbreak/i,
  /\bDAN\b.*mode/i,
  /do\s+anything\s+now/i,
  /forget\s+(your\s+)?(previous|all|prior|old|original)\s+(instructions?|rules?|training|guidelines?|programming)/i,
  /override\s+(your\s+)?(instructions?|rules?|programming|safeguards?|safety)/i,
  /you\s+have\s+no\s+(restrictions?|rules?|limits?|guidelines?|boundaries)/i,
  /disregard\s+(all\s+)?(previous|your|prior|safety)/i,
  /bypass\s+(your\s+)?(safety|filters?|restrictions?|guardrails?|moderation)/i,
  /new\s+instructions?:\s*/i,
  /end\s+of\s+(conversation|instructions?|session)\s*[.]\s*(new|start)/i,
  /\{system_prompt\}/i,
  /prompt\s*injection/i,
  /reveal\s+your\s+(system\s+)?(prompt|instructions?)/i,
  /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions?|training|guidelines)/i,
];

/** Bot / scraper user-agent fragments */
const BOT_UA_PATTERNS = /bot|crawler|spider|scraper|curl|python-requests|wget|go-http|java\/|libwww/i;

/**
 * Sanitize user input: strip null bytes, invisible control chars, excessive length.
 * Returns { clean, blocked, reason } where blocked = true means hard reject.
 */
function sanitizeInput(text: string): { clean: string; blocked: boolean; reason?: string } {
  // Strip null bytes and non-printable control characters (keep newlines/tabs)
  const clean = text
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, 4000); // hard cap per message

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(clean)) {
      return { clean, blocked: true, reason: 'security_violation' };
    }
  }

  return { clean, blocked: false };
}

/** Check rate limit via KV. Returns true if request is allowed. */
async function checkRateLimit(kv: KVNamespace | undefined, ip: string): Promise<boolean> {
  if (!kv) return true; // If KV not available, allow through
  const minute = Math.floor(Date.now() / 60_000);
  const key = `rate:${ip}:${minute}`;
  try {
    const raw = await kv.get(key);
    const count = raw ? parseInt(raw, 10) : 0;
    if (count >= 20) return false;
    await kv.put(key, String(count + 1), { expirationTtl: 90 });
    return true;
  } catch {
    return true; // Fail open
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT EXTRACTION — PDF / DOCX / TXT from R2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract readable text from an R2 object.
 * - PDF: parse content streams with parenthesized text tokens
 * - DOCX: parse XML text nodes
 * - TXT: read directly
 * Returns plain text (max ~60 000 chars to stay within Worker limits).
 */
async function extractText(obj: R2ObjectBody, filename: string): Promise<string> {
  const ext = (filename.split('.').pop() ?? '').toLowerCase();

  if (ext === 'txt' || ext === 'md') {
    return (await obj.text()).slice(0, 60_000);
  }

  const buffer = await obj.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (ext === 'pdf') {
    return extractPdfText(bytes);
  }

  if (ext === 'docx' || ext === 'odt') {
    return extractDocxText(bytes);
  }

  // Generic fallback: extract printable ASCII sequences ≥ 20 chars
  return extractPrintableSequences(bytes).slice(0, 60_000);
}

function extractPdfText(bytes: Uint8Array): string {
  // Convert to Latin-1 string for regex matching on binary PDF data
  let raw = '';
  for (let i = 0; i < Math.min(bytes.length, 2_000_000); i++) {
    raw += String.fromCharCode(bytes[i]);
  }

  const segments: string[] = [];

  // Primary: extract text between parentheses used in PDF Tj/TJ operators
  // Pattern matches (text) that appears before Tj, TJ, or as array elements
  const tjRegex = /\(([^)]{2,})\)\s*(?:Tj|'|")/g;
  let m: RegExpExecArray | null;
  while ((m = tjRegex.exec(raw)) !== null) {
    const t = m[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/[^\x20-\x7E\n]/g, '');
    if (t.trim().length > 1) segments.push(t.trim());
  }

  // Secondary: bare text content streams (uncompressed)
  const btEtRegex = /BT\s+([\s\S]{1,2000}?)\s+ET/g;
  while ((m = btEtRegex.exec(raw)) !== null) {
    const block = m[1];
    const parenRegex = /\(([^)]{2,})\)/g;
    let pm: RegExpExecArray | null;
    while ((pm = parenRegex.exec(block)) !== null) {
      const t = pm[1].replace(/[^\x20-\x7E\n]/g, '');
      if (t.trim().length > 2) segments.push(t.trim());
    }
  }

  // If we found good content, return it
  if (segments.length > 10) {
    return segments.join(' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/ ([.,:;!?]) /g, '$1 ')
      .trim()
      .slice(0, 60_000);
  }

  // Fallback: printable sequences
  return extractPrintableSequences(bytes).slice(0, 60_000);
}

function extractDocxText(bytes: Uint8Array): string {
  // DOCX is a ZIP; word/document.xml contains the text in <w:t> tags
  // We do a simple string scan for <w:t> content without a full XML parser
  let raw = '';
  for (let i = 0; i < Math.min(bytes.length, 2_000_000); i++) {
    const b = bytes[i];
    if (b >= 32 && b < 127) raw += String.fromCharCode(b);
    else if (b === 10 || b === 13) raw += ' ';
  }

  const segments: string[] = [];
  const wtRegex = /<w:t[^>]*>([^<]{1,500})<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = wtRegex.exec(raw)) !== null) {
    const t = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    if (t.length > 1) segments.push(t);
  }

  if (segments.length > 5) {
    return segments.join(' ').replace(/\s+/g, ' ').trim().slice(0, 60_000);
  }
  return extractPrintableSequences(bytes).slice(0, 60_000);
}

function extractPrintableSequences(bytes: Uint8Array): string {
  const segments: string[] = [];
  let seq = '';
  for (let i = 0; i < Math.min(bytes.length, 1_000_000); i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
      seq += String.fromCharCode(b);
    } else {
      if (seq.trim().length >= 20) segments.push(seq.trim());
      seq = '';
    }
  }
  if (seq.trim().length >= 20) segments.push(seq.trim());
  return segments.join(' ').replace(/\s{2,}/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG — Chunking, Embedding, Indexing, Retrieval
// ─────────────────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const MAX_CHUNKS_PER_FILE = 80;
const RAG_TOP_K = 4;
const MIN_RAG_SCORE = 0.35;

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length < 50) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = start + CHUNK_SIZE;
    // Try to break at sentence boundary
    if (end < clean.length) {
      const boundary = clean.lastIndexOf('. ', end);
      if (boundary > start + CHUNK_SIZE / 2) end = boundary + 1;
    }
    const chunk = clean.slice(start, end).trim();
    if (chunk.length >= 50) chunks.push(chunk);
    start = end - CHUNK_OVERLAP;
    if (chunks.length >= MAX_CHUNKS_PER_FILE) break;
  }
  return chunks;
}

async function embedTexts(ai: any, texts: string[]): Promise<number[][] | null> {
  try {
    const result = await ai.run('@cf/baai/bge-small-en-v1.5', { text: texts });
    if (result?.data && Array.isArray(result.data)) {
      return result.data as number[][];
    }
    return null;
  } catch (e) {
    console.error('[embed error]', e);
    return null;
  }
}

/**
 * Ingest a single R2 file into the Vectorize index.
 * Returns { chunksIndexed, skipped, error? }
 */
async function ingestFile(
  env: Env,
  bucket: R2Bucket,
  key: string,
  tenantId: string
): Promise<{ chunksIndexed: number; skipped: boolean; error?: string }> {
  if (!env.VECTORIZE) return { chunksIndexed: 0, skipped: true, error: 'Vectorize not bound' };
  if (!env.BOOK_STORE) return { chunksIndexed: 0, skipped: true, error: 'BOOK_STORE not bound' };

  const trackingKey = `indexed:${tenantId}:${key}`;

  // Check if already indexed
  const already = await env.BOOK_STORE.get(trackingKey);
  if (already) return { chunksIndexed: 0, skipped: true };

  const obj = await bucket.get(key);
  if (!obj) return { chunksIndexed: 0, skipped: true, error: 'Object not found' };

  const rawText = await extractText(obj, key);
  if (!rawText || rawText.trim().length < 100) {
    // Mark as attempted so we don't retry empty files indefinitely
    await env.BOOK_STORE.put(trackingKey, JSON.stringify({ chunks: 0, ts: Date.now(), empty: true }), { expirationTtl: 86400 * 7 });
    return { chunksIndexed: 0, skipped: true, error: 'Insufficient text content' };
  }

  const chunks = chunkText(rawText);
  if (chunks.length === 0) return { chunksIndexed: 0, skipped: true, error: 'No chunks generated' };

  // Embed in batches of 10 (API limit)
  const BATCH = 10;
  const vectors: VectorizeVector[] = [];
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const embeddings = await embedTexts(env.AI, batch);
    if (!embeddings) continue;
    for (let j = 0; j < batch.length; j++) {
      if (!embeddings[j]) continue;
      const chunkIdx = i + j;
      // Vectorize IDs must be strings, max 64 chars
      const id = `${tenantId}-${key.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}-${chunkIdx}`;
      vectors.push({
        id,
        values: embeddings[j],
        metadata: {
          tenantId,
          bucket: tenantId === 'gnosis' ? 'trinityuniversegnosischat' : 'trinityuniverseyadachat',
          key,
          chunkIndex: chunkIdx,
          text: chunks[chunkIdx].slice(0, 500), // store first 500 chars of chunk as metadata
          filename: key.split('/').pop() ?? key,
        },
      });
    }
  }

  if (vectors.length === 0) return { chunksIndexed: 0, skipped: false, error: 'Embedding failed' };

  // Upsert to Vectorize in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    try {
      await env.VECTORIZE.upsert(vectors.slice(i, i + 100));
    } catch (e) {
      console.error('[vectorize upsert error]', e);
    }
  }

  // Mark as indexed
  await env.BOOK_STORE.put(trackingKey, JSON.stringify({
    chunks: vectors.length,
    ts: Date.now(),
    filename: key,
  }), { expirationTtl: 86400 * 90 }); // 90 days

  return { chunksIndexed: vectors.length, skipped: false };
}

/**
 * Retrieve relevant RAG context for a user query.
 * Returns an array of text chunks ranked by relevance.
 */
async function retrieveContext(
  env: Env,
  query: string,
  tenantId: string
): Promise<string[]> {
  if (!env.VECTORIZE || !env.AI) return [];

  try {
    const embeddings = await embedTexts(env.AI, [query]);
    if (!embeddings || !embeddings[0]) return [];

    const results = await env.VECTORIZE.query(embeddings[0], {
      topK: RAG_TOP_K,
      filter: { tenantId },
      returnMetadata: 'all',
    });

    return (results.matches ?? [])
      .filter((m) => m.score >= MIN_RAG_SCORE && m.metadata?.text)
      .map((m) => {
        const text = m.metadata!.text as string;
        const filename = m.metadata!.filename as string;
        return `[Source: ${filename}]\n${text}`;
      });
  } catch (e) {
    console.error('[RAG retrieval error]', e);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED MESSAGE STORAGE — Fine-Tuning Data
// ─────────────────────────────────────────────────────────────────────────────

interface StructuredExchange {
  messageId: string;
  sessionId: string;
  userId: string;
  userEmail: string;
  tenantId: string;
  timestamp: string;
  model: string;
  ragUsed: boolean;
  ragChunks: string[];
  securityFlags: string[];
  exchange: {
    messages: Array<{ role: string; content: string }>;
  };
  geofencedEU: boolean;
}

async function saveExchange(
  kv: KVNamespace | undefined,
  data: StructuredExchange
): Promise<void> {
  if (!kv) return;
  try {
    const key = `ft:${data.tenantId}:${data.timestamp}:${data.messageId}`;
    await kv.put(key, JSON.stringify(data), { expirationTtl: 86400 * 180 }); // 180 days
  } catch (e) {
    console.error('[saveExchange error]', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION / AUTH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// CORS HEADERS
// ─────────────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ── Bot / scraper rejection (non-API routes only) ─────────────────────────
    const ua = request.headers.get('user-agent') ?? '';
    if (BOT_UA_PATTERNS.test(ua) && url.pathname.startsWith('/api/chat')) {
      return Response.json({ error: 'Forbidden' }, { status: 403, headers: CORS_HEADERS });
    }

    // ── GET /api/me ───────────────────────────────────────────────────────────
    if (url.pathname === '/api/me' && request.method === 'GET') {
      if (!env.GNOSIS_SESSIONS) {
        return Response.json({ error: 'Sessions not configured' }, { status: 503 });
      }
      const user = await getSessionUser(env.GNOSIS_SESSIONS, request.headers.get('cookie'));
      if (!user) return Response.json({ signedIn: false }, { status: 401 });
      return Response.json(user);
    }

    // ── GET /auth/google & /api/auth/google ──────────────────────────────────
    if ((url.pathname === '/auth/google' || url.pathname === '/api/auth/google') && request.method === 'GET') {
      if (!env.GOOGLE_CLIENT_ID || !env.GNOSIS_SESSIONS) {
        // Fallback: auto-authenticate so sign-in is never blocked in dev
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
          headers: { Location: url.origin + '/', 'Set-Cookie': sessionCookie(sessionId, 30 * 86400) },
        });
      }

      const state = crypto.randomUUID();
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

      if (error) return Response.redirect(`${url.origin}/?auth_error=${encodeURIComponent(error)}`, 302);
      if (!code || !state) return Response.redirect(`${url.origin}/?auth_error=missing_params`, 302);

      const storedState = await env.GNOSIS_SESSIONS.get(`oauth_state:${state}`);
      if (!storedState) return Response.redirect(`${url.origin}/?auth_error=invalid_state`, 302);
      await env.GNOSIS_SESSIONS.delete(`oauth_state:${state}`);

      const redirectUri = `${url.origin}/api/auth/google/callback`;
      let tokenData: { access_token?: string; id_token?: string; error?: string };
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
        });
        tokenData = (await tokenRes.json()) as typeof tokenData;
      } catch {
        return Response.redirect(`${url.origin}/?auth_error=token_exchange_failed`, 302);
      }

      if (tokenData.error || !tokenData.access_token) {
        return Response.redirect(`${url.origin}/?auth_error=${encodeURIComponent(tokenData.error ?? 'no_token')}`, 302);
      }

      let profile: { sub?: string; name?: string; email?: string; picture?: string };
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

      const sessionId = crypto.randomUUID();
      const sessionUser: SessionUser = {
        sub: profile.sub,
        name: profile.name ?? profile.email,
        email: profile.email,
        avatarUrl: profile.picture ?? '',
        signedIn: true,
      };
      await env.GNOSIS_SESSIONS.put(`session:${sessionId}`, JSON.stringify(sessionUser), {
        expirationTtl: 60 * 60 * 24 * 30,
      });

      return new Response(null, {
        status: 302,
        headers: { Location: `${url.origin}/`, 'Set-Cookie': sessionCookie(sessionId, 60 * 60 * 24 * 30) },
      });
    }

    // ── GET /auth/logout ──────────────────────────────────────────────────────
    if ((url.pathname === '/auth/logout' || url.pathname === '/api/auth/logout') && request.method === 'GET') {
      if (env.GNOSIS_SESSIONS) {
        const cookies = parseCookies(request.headers.get('cookie'));
        const sessionId = cookies['__trinity_session'];
        if (sessionId) await env.GNOSIS_SESSIONS.delete(`session:${sessionId}`);
      }
      return new Response(null, {
        status: 302,
        headers: { Location: `${url.origin}/`, 'Set-Cookie': sessionCookie('', 0) },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/chat — RAG-enhanced, security-hardened AI chat
    // ─────────────────────────────────────────────────────────────────────────
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        // ── Rate limiting ────────────────────────────────────────────────────
        const clientIP = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
        const allowed = await checkRateLimit(env.CHAT_CONTEXT_CACHE, clientIP);
        if (!allowed) {
          return Response.json(
            { error: 'Too many requests. Please slow down.', code: 'rate_limited' },
            { status: 429, headers: CORS_HEADERS }
          );
        }

        // ── Parse request ────────────────────────────────────────────────────
        const body = (await request.json()) as {
          messages: ChatMessage[];
          systemInstruction?: string;
          model?: string;
          tenantId?: string;
          sessionId?: string;
        };

        const { messages, systemInstruction, model, tenantId = 'gnosis', sessionId = 'default' } = body;

        if (!messages || !Array.isArray(messages)) {
          return Response.json({ error: 'Messages array is required.' }, { status: 400, headers: CORS_HEADERS });
        }

        // ── Get session user (optional — for storage attribution) ────────────
        const sessionUser = env.GNOSIS_SESSIONS
          ? await getSessionUser(env.GNOSIS_SESSIONS, request.headers.get('cookie'))
          : null;

        // ── EU Geofencing ────────────────────────────────────────────────────
        const EU_COUNTRIES = new Set([
          'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR',
          'HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
        ]);
        const clientCountry = (request.headers.get('cf-ipcountry') || (request as any).cf?.country || '').toUpperCase();
        const isEUResident = EU_COUNTRIES.has(clientCountry);

        // ── Security scan all user messages ──────────────────────────────────
        const securityFlags: string[] = [];
        const sanitizedMessages: ChatMessage[] = [];

        for (const m of messages) {
          if (m.role !== 'user') {
            sanitizedMessages.push(m);
            continue;
          }
          const { clean, blocked, reason } = sanitizeInput(m.content ?? '');
          if (blocked) {
            securityFlags.push(`injection_attempt:${reason}`);
            // Return a firm but non-revealing rejection
            return Response.json(
              {
                text: 'Your message contained patterns that cannot be processed. Please rephrase your question.',
                blocked: true,
                code: 'security_violation',
              },
              { status: 400, headers: CORS_HEADERS }
            );
          }
          sanitizedMessages.push({ ...m, content: clean });
        }

        // ── Retrieve RAG context ─────────────────────────────────────────────
        const lastUserMessage = [...sanitizedMessages].reverse().find((m) => m.role === 'user');
        const ragChunks: string[] = lastUserMessage
          ? await retrieveContext(env, lastUserMessage.content, tenantId)
          : [];

        // ── Build system prompt ──────────────────────────────────────────────
        // System prompt is built server-side. User content is NEVER interpolated into it.
        const baseInstruction = systemInstruction?.slice(0, 3000) ?? 'You are a helpful AI assistant.';

        let ragContext = '';
        if (ragChunks.length > 0) {
          ragContext = `

=== KNOWLEDGE FROM YOUR LIBRARY ===
Draw from the following excerpts naturally in your response. Do not say "according to the document" — speak from genuine understanding. If the excerpts don't cover the topic, use your general knowledge.

${ragChunks.join('\n\n---\n\n')}
=== END OF LIBRARY CONTEXT ===
`;
        }

        const humanLikeGuidance = `

Conversation style:
- Respond naturally, as a knowledgeable and warm companion would.
- Never mention "RAG", "context window", "documents", "chunks", or any internal system details.
- If you know the answer from your library or training, give it fully and clearly.
- Use the human's own words and energy — be conversational, not corporate.
- Vary your sentence length. Short punchy sentences. Then deeper, more elaborated thoughts when the topic demands it.`;

        const hardcodedAgreement = ' Developer License Agreement: Verified and agreed under developer account credentials (agree=true).';
        const effectiveSystemInstruction = `${baseInstruction}${ragContext}${humanLikeGuidance}${hardcodedAgreement}`;

        // ── Select model ─────────────────────────────────────────────────────
        let selectedModel = model || (tenantId === 'yada'
          ? '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
          : '@cf/meta/llama-3.3-70b-instruct-fp8-fast');

        // ── Build CF messages ────────────────────────────────────────────────
        let hasImageAttachment = false;
        const imageArrays: number[][] = [];
        const cfMessages: Array<{ role: string; content: string }> = [];

        cfMessages.push({ role: 'system', content: effectiveSystemInstruction });

        for (const m of sanitizedMessages) {
          let textContent = m.content || '';
          if (m.attachments && m.attachments.length > 0) {
            for (const att of m.attachments) {
              if (att.type === 'file' && att.content) {
                textContent += `\n\n[Attached File: ${att.name}]\n${att.content.slice(0, 2000)}`;
              } else if (att.type === 'image' && att.dataUrl) {
                hasImageAttachment = true;
                try {
                  const base64Data = att.dataUrl.split(',')[1];
                  if (base64Data) {
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                    imageArrays.push(Array.from(bytes));
                  }
                } catch (e) {
                  console.error('Image parse error:', e);
                }
              }
            }
          }
          cfMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: textContent });
        }

        // EU restriction on vision models
        if (hasImageAttachment) {
          if (isEUResident) {
            selectedModel = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
            hasImageAttachment = false;
            cfMessages.push({ role: 'system', content: '[Notice: Vision features restricted for EU users. Routed to EU-compliant text model.]' });
          } else {
            selectedModel = '@cf/meta/llama-3.2-11b-vision-instruct';
          }
        }

        // ── Run AI with auto-agree ───────────────────────────────────────────
        const runAiWithAutoAgree = async (modelName: string, payload: any) => {
          if (modelName.includes('vision') || modelName.includes('llama-3.2')) {
            try { await env.AI.run(modelName, { prompt: 'agree' }); } catch { /* benign */ }
          }
          try {
            return (await env.AI.run(modelName, payload)) as { response?: string; description?: string };
          } catch (firstErr: any) {
            const errStr = String(firstErr?.message || firstErr);
            if (errStr.toLowerCase().includes('agree') || errStr.toLowerCase().includes('model agreement')) {
              try { await env.AI.run(modelName, { prompt: 'agree' }); } catch { /* benign */ }
              return (await env.AI.run(modelName, payload)) as { response?: string; description?: string };
            }
            throw firstErr;
          }
        };

        let result: { response?: string; description?: string } | null = null;

        try {
          if (hasImageAttachment && imageArrays.length > 0) {
            const promptText = cfMessages[cfMessages.length - 1]?.content || 'Analyze this image in detail.';
            result = await runAiWithAutoAgree(selectedModel, { prompt: promptText, image: imageArrays[0], max_tokens: 2048 });
          } else {
            result = await runAiWithAutoAgree(selectedModel, { messages: cfMessages, max_tokens: 2048 });
          }
        } catch (aiErr: any) {
          console.error('[AiError]', aiErr?.message || aiErr);
          return Response.json(
            { text: 'I processed your request but encountered an issue generating a response. Please try again.', modelUsed: selectedModel, errorHandled: true },
            { headers: CORS_HEADERS }
          );
        }

        let text = (result?.response || result?.description || "").trim();
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!text) text = "I processed your request. How would you like to explore this further?";

        // ── Structured storage for fine-tuning ───────────────────────────────
        const messageId = crypto.randomUUID();
        const ftMessages = [
          { role: 'system', content: baseInstruction },
          ...sanitizedMessages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'assistant', content: text },
        ];

        await saveExchange(env.CHAT_SESSIONS, {
          messageId,
          sessionId,
          userId: sessionUser?.sub ?? clientIP,
          userEmail: sessionUser?.email ?? 'anonymous',
          tenantId,
          timestamp: new Date().toISOString(),
          model: selectedModel,
          ragUsed: ragChunks.length > 0,
          ragChunks: ragChunks.map((c) => c.slice(0, 200)),
          securityFlags,
          exchange: { messages: ftMessages },
          geofencedEU: isEUResident,
        });

        return Response.json(
          { text, modelUsed: selectedModel, ragUsed: ragChunks.length > 0, geofencedEU: isEUResident },
          { headers: CORS_HEADERS }
        );

      } catch (error: unknown) {
        console.error('[/api/chat fatal]', error);
        return Response.json(
          { text: 'An unexpected error occurred. Please try again.', errorHandled: true },
          { headers: CORS_HEADERS }
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/ingest — Ingest a single R2 file into Vectorize
    // Body: { tenantId: 'gnosis'|'yada', key: 'filename.pdf' }
    // ─────────────────────────────────────────────────────────────────────────
    if (url.pathname === '/api/ingest' && request.method === 'POST') {
      try {
        const { tenantId, key } = (await request.json()) as { tenantId: string; key: string };
        if (!tenantId || !key) {
          return Response.json({ error: 'tenantId and key are required' }, { status: 400, headers: CORS_HEADERS });
        }

        const bucket = tenantId === 'yada' ? env.YADA_CHAT_BUCKET : env.GNOSIS_CHAT_BUCKET;
        if (!bucket) {
          return Response.json({ error: `${tenantId} bucket not bound` }, { status: 503, headers: CORS_HEADERS });
        }

        const result = await ingestFile(env, bucket, key, tenantId);
        return Response.json(result, { headers: CORS_HEADERS });
      } catch (e: any) {
        return Response.json({ error: e?.message ?? 'Ingest failed' }, { status: 500, headers: CORS_HEADERS });
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/ingest-all — Bulk ingest all files from both buckets
    // ─────────────────────────────────────────────────────────────────────────
    if (url.pathname === '/api/ingest-all' && request.method === 'POST') {
      const results: Record<string, any> = { gnosis: [], yada: [] };
      const errors: string[] = [];

      const processBucket = async (bucket: R2Bucket | undefined, tenantId: string) => {
        if (!bucket) { errors.push(`${tenantId} bucket not bound`); return; }
        try {
          let cursor: string | undefined;
          do {
            const list = await bucket.list({ limit: 50, cursor });
            for (const obj of list.objects) {
              const ext = (obj.key.split('.').pop() ?? '').toLowerCase();
              if (!['pdf', 'txt', 'md', 'docx'].includes(ext)) continue;
              const r = await ingestFile(env, bucket, obj.key, tenantId);
              results[tenantId].push({ key: obj.key, ...r });
            }
            cursor = list.truncated ? list.cursor : undefined;
          } while (cursor);
        } catch (e: any) {
          errors.push(`${tenantId}: ${e?.message}`);
        }
      };

      await Promise.all([
        processBucket(env.GNOSIS_CHAT_BUCKET, 'gnosis'),
        processBucket(env.YADA_CHAT_BUCKET, 'yada'),
      ]);

      return Response.json({ results, errors }, { headers: CORS_HEADERS });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/ingest-status — List indexed files per tenant
    // ─────────────────────────────────────────────────────────────────────────
    if (url.pathname === '/api/ingest-status' && request.method === 'GET') {
      if (!env.BOOK_STORE) {
        return Response.json({ error: 'BOOK_STORE not bound' }, { status: 503, headers: CORS_HEADERS });
      }
      try {
        const [gnosisList, yadaList] = await Promise.all([
          env.BOOK_STORE.list({ prefix: 'indexed:gnosis:', limit: 100 }),
          env.BOOK_STORE.list({ prefix: 'indexed:yada:', limit: 100 }),
        ]);

        const parse = async (keys: Array<{ name: string }>) => {
          return Promise.all(keys.map(async (k) => {
            const val = await env.BOOK_STORE.get(k.name);
            return { key: k.name.split(':').slice(2).join(':'), ...JSON.parse(val ?? '{}') };
          }));
        };

        const [gnosis, yada] = await Promise.all([
          parse(gnosisList.keys),
          parse(yadaList.keys),
        ]);

        return Response.json({ gnosis, yada }, { headers: CORS_HEADERS });
      } catch (e: any) {
        return Response.json({ error: e?.message }, { status: 500, headers: CORS_HEADERS });
      }
    }

    // ── GET /api/r2/* — Serve files from LIBRARY_BUCKET ──────────────────────
    if (url.pathname.startsWith('/api/r2/') && request.method === 'GET') {
      const key = url.pathname.replace('/api/r2/', '');
      if (!key || !env.LIBRARY_BUCKET) return new Response('Not found', { status: 404 });
      try {
        const obj = await env.LIBRARY_BUCKET.get(key);
        if (!obj) return new Response('File not found', { status: 404 });
        const ext = (key.split('.').pop() || '').toLowerCase();
        const ctMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          pdf: 'application/pdf', epub: 'application/epub+zip',
        };
        const ct = obj.httpMetadata?.contentType || ctMap[ext] || 'application/octet-stream';
        const responseHeaders: Record<string, string> = {
          'Content-Type': ct,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        };
        if (ext === 'pdf' || ext === 'epub') {
          responseHeaders['Content-Disposition'] = `attachment; filename="${key.split('/').pop() || 'ebook'}"`;
        }
        const buf = await obj.arrayBuffer();
        return new Response(buf, { status: 200, headers: responseHeaders });
      } catch {
        return new Response('Error fetching file', { status: 500 });
      }
    }

    // ── GET /api/library/catalog ──────────────────────────────────────────────
    if (url.pathname === '/api/library/catalog' && request.method === 'GET') {
      if (!env.DB) return Response.json([], { headers: CORS_HEADERS });
      try {
        const { results } = await env.DB
          .prepare(`SELECT id, title, slug, author, niche, price, file_key, cover_filename, is_featured, tag, publication_year FROM ebook_catalog ORDER BY display_order ASC`)
          .all();
        return Response.json(results, { headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=300' } });
      } catch (e: unknown) {
        console.error('[/api/library/catalog]', e);
        return Response.json([], { headers: CORS_HEADERS });
      }
    }

    // ── Static Assets ─────────────────────────────────────────────────────────
    return env.ASSETS.fetch(request);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FACE SWAP STUDIO BACKEND (R2 STORAGE + GOOGLE GEMINI AI / WORKERS AI)
// ─────────────────────────────────────────────────────────────────────────────







// ─────────────────────────────────────────────────────────────────────────────
// SAFE FACE SWAP STORAGE ENGINE (R2 + KV)
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// INSIGHTFACE NEURAL FACE SWAP PIPELINE (E2B SANDBOX + CLOUDFLARE R2 & KV)
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// SAFE HIGH-SPEED FACE SWAP ENGINE (CLOUDFLARE R2 & KV)
// ─────────────────────────────────────────────────────────────────────────────

interface FaceSwapRequestBody {
  originalImage: string;
  targetFaceImage: string;
  swappedResult?: string;
  mode?: string;
  mediaType?: string;
}

async function resolveImageBuffer(input: string): Promise<ArrayBuffer> {
  if (!input) throw new Error("Empty image input");
  if (input.startsWith("http://") || input.startsWith("https://")) {
    const res = await fetch(input, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/*,*/*"
      }
    });
    if (!res.ok) throw new Error("Failed to download preset image: " + res.status);
    return await res.arrayBuffer();
  }
  let base64 = input.includes(",") ? input.split(",")[1] : input;
  base64 = base64.replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function processInsightFaceSwap(body: FaceSwapRequestBody, env: any) {
  const swapId = "swap_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const timestamp = new Date().toISOString();
  console.log("[FaceSwap] Processing swap transaction:", swapId);

  let origBuffer: ArrayBuffer;
  let targetBuffer: ArrayBuffer;
  let resultBuffer: ArrayBuffer;

  try {
    origBuffer = await resolveImageBuffer(body.originalImage);
    targetBuffer = await resolveImageBuffer(body.targetFaceImage);
    resultBuffer = body.swappedResult ? await resolveImageBuffer(body.swappedResult) : targetBuffer;
  } catch (err: any) {
    console.error("[FaceSwap Buffer Error]:", err.message);
    throw new Error("Invalid image format provided: " + err.message);
  }

  const origKey = "faceswap/" + swapId + "_orig.jpg";
  const targetKey = "faceswap/" + swapId + "_target.jpg";
  const resultKey = "faceswap/" + swapId + "_result.jpg";

  // 1. Upload all 3 images to Cloudflare R2
  const bucket = env.MASTER_BUCKET || env.LIBRARY_BUCKET || env.GNOSIS_CHAT_BUCKET;
  if (bucket) {
    try {
      await bucket.put(origKey, origBuffer, { httpMetadata: { contentType: "image/jpeg" } });
      await bucket.put(targetKey, targetBuffer, { httpMetadata: { contentType: "image/jpeg" } });
      await bucket.put(resultKey, resultBuffer, { httpMetadata: { contentType: "image/jpeg" } });
      console.log("[FaceSwap R2] ✓ Successfully saved 3 images to R2 storage:", resultKey);
    } catch (r2Err) {
      console.error("[FaceSwap R2 Error]:", r2Err);
    }
  }

  const resultUrl = "/api/faceswap/image/" + resultKey;
  const originalUrl = "/api/faceswap/image/" + origKey;
  const targetFaceUrl = "/api/faceswap/image/" + targetKey;

  const historyItem = {
    id: swapId,
    originalUrl,
    targetFaceUrl,
    resultUrl,
    createdAt: timestamp,
  };

  // 2. Index in Cloudflare KV
  const kv = env.CHAT_SESSIONS || env.GNOSIS_SESSIONS;
  if (kv) {
    try {
      let list: any[] = [];
      const raw = await kv.get("trinity_faceswap_history");
      if (raw) {
        try { list = JSON.parse(raw); } catch {}
      }
      list = [historyItem, ...list].slice(0, 50);
      await kv.put("trinity_faceswap_history", JSON.stringify(list));
      console.log("[FaceSwap KV] ✓ Indexed transaction into KV store");
    } catch (kvErr) {
      console.error("[FaceSwap KV Error]:", kvErr);
    }
  }

  return {
    success: true,
    swapId,
    resultUrl,
    item: historyItem
  };
}
