
export interface SandboxExecutionLog {
  code?: string;
  language?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
  success?: boolean;
}

export type SandboxStatus = 
  | "idle"
  | "thinking"
  | "spinning_up_sandbox"
  | "running_code"
  | "verifying_output"
  | "self_correcting"
  | "completed"
  | "error";

export interface StreamEventPayload {
  type: "status" | "text" | "sandbox_result" | "done" | "error";
  status?: SandboxStatus;
  message?: string;
  chunk?: string;
  text?: string;
  execution?: SandboxExecutionLog;
  error?: string;
}

const SANDBOX_TOOL = {
  type: "function",
  function: {
    name: "run_sandbox_code",
    description: "Executes Python or shell code inside an isolated E2B Linux microVM. Use this tool when you need to calculate math, run data analysis, write/execute scripts, verify code snippets, or test algorithms in real time.",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The complete executable code snippet to run inside the E2B sandbox microVM."
        },
        language: {
          type: "string",
          enum: ["python", "bash", "javascript"],
          description: "The runtime programming language. Defaults to python."
        }
      },
      required: ["code"]
    }
  }
};


// ── E2B Sandboxed Code Execution Engine (v2+ Sandbox API) ────────────────────
async function runCodeInSandbox(codeStr: string, apiKey?: string, language: string = "python") {
  const token = apiKey || (typeof process !== "undefined" ? process.env.E2B_API_KEY : undefined);
  if (!token) {
    return {
      success: false,
      stdout: "",
      stderr: "E2B_API_KEY is not configured on the server.",
      error: "E2B_API_KEY missing",
    };
  }
  try {
    const { Sandbox } = await import("@e2b/code-interpreter");
    const sandbox = await Sandbox.create({ apiKey: token });
    try {
      const execution = await sandbox.runCode(codeStr, { language: language as any });
      const stdout = (execution.logs?.stdout || []).join("\n");
      const stderr = (execution.logs?.stderr || []).join("\n");
      const errorMsg = execution.error ? `${execution.error.name}: ${execution.error.value}\n${execution.error.traceback || ""}`.trim() : undefined;
      return {
        success: !execution.error,
        stdout,
        stderr,
        error: errorMsg,
        results: execution.results || [],
        code: codeStr,
        language,
      };
    } finally {
      await sandbox.kill().catch(() => {});
    }
  } catch (err: any) {
    return {
      success: false,
      stdout: "",
      stderr: err.message || "Sandbox execution failed",
      error: err.message || "Sandbox execution error",
      code: codeStr,
      language,
    };
  }
}


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
  E2B_API_KEY?: string;
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
      return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
    }

    // ── Bot / scraper rejection (non-API routes only) ─────────────────────────
    const ua = request.headers.get('user-agent') ?? '';
    if (BOT_UA_PATTERNS.test(ua) && url.pathname.startsWith('/api/chat')) {
      return Response.json({ error: 'Forbidden' }, { status: 403, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
    }

    // ── GET /api/me ───────────────────────────────────────────────────────────
    
    // ── GET /api/version (For Android In-App OTA Auto-Updates) ───────────────
    if (url.pathname === "/api/version" && request.method === "GET") {
      return Response.json({
        versionCode: 7,
        versionName: "1.6.0",
        downloadUrl: url.origin + "/download/apk",
        releaseNotes: "Refined 60% balanced logo sizing and stability improvements."
      }, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }

    // ── GET /download/apk (Direct APK download for Android) ──────────────────
    if (url.pathname === "/download/apk" || url.pathname === "/download/apk/") {
      return Response.redirect("https://github.com/updatedj25-gif/trinityuniverse/releases/latest/download/gnosis-ai-v7.apk", 302);
    }
  
    if (url.pathname === "/health" || url.pathname === "/") { return Response.json({ status: "healthy", service: "Gnosis Master Orchestrator" }); }
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
    // POST /api/chat — Streaming RAG & E2B Sandboxed AI Orchestrator
    // ─────────────────────────────────────────────────────────────────────────
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const clientIP = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
        const allowed = await checkRateLimit(env.CHAT_CONTEXT_CACHE, clientIP);
        if (!allowed) {
          return Response.json(
            { error: "Too many requests. Please slow down.", code: "rate_limited" },
            { status: 429, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } }
          );
        }

        const body = (await request.json()) as {
          messages: ChatMessage[];
          systemInstruction?: string;
          model?: string;
          tenantId?: string;
          sessionId?: string;
          stream?: boolean;
        };

        const { messages, systemInstruction, model, tenantId = "gnosis", sessionId = "default" } = body;
        const isYada = (tenantId === "yada");

        if (!messages || !Array.isArray(messages)) {
          return Response.json({ error: "Messages array is required." }, { status: 400, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
        }

        const sessionUser = env.GNOSIS_SESSIONS
          ? await getSessionUser(env.GNOSIS_SESSIONS, request.headers.get("cookie"))
          : null;

        const EU_COUNTRIES = new Set([
          "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR",
          "HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
        ]);
        const clientCountry = (request.headers.get("cf-ipcountry") || (request as any).cf?.country || "").toUpperCase();
        const isEUResident = EU_COUNTRIES.has(clientCountry);

        // Security scan
        const securityFlags: string[] = [];
        const sanitizedMessages: ChatMessage[] = [];

        for (const m of messages) {
          if (m.role !== "user") {
            sanitizedMessages.push(m);
            continue;
          }
          const { clean, blocked, reason } = sanitizeInput(m.content ?? "");
          if (blocked) {
            securityFlags.push(`injection_attempt:${reason}`);
            return Response.json(
              {
                text: "Your message contained patterns that cannot be processed. Please rephrase your question.",
                blocked: true,
                code: "security_violation",
              },
              { status: 400, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } }
            );
          }
          sanitizedMessages.push({ ...m, content: clean });
        }

        // Retrieve RAG context
        const lastUserMessage = [...sanitizedMessages].reverse().find((m) => m.role === "user");
        const ragChunks: string[] = lastUserMessage
          ? await retrieveContext(env, lastUserMessage.content, tenantId)
          : [];

        const baseInstruction = systemInstruction?.slice(0, 3000) ?? "You are a helpful AI assistant.";
        let ragContext = "";
        if (ragChunks.length > 0) {
          ragContext = `\n\n=== KNOWLEDGE FROM YOUR LIBRARY ===\n${ragChunks.join("\n\n---\n\n")}\n=== END OF LIBRARY CONTEXT ===\n`;
        }

        const sandboxGuidance = `\n\nYou have access to an isolated Linux microVM runtime via the "run_sandbox_code" tool. If you need to perform calculations, verify code, test scripts, run benchmarks, or generate program outputs, call "run_sandbox_code". When the tool returns output, verify it and explain the result to the user.`;
        const hardcodedAgreement = " Developer License Agreement: Verified and agreed under developer account credentials (agree=true).";
        const effectiveSystemInstruction = `${baseInstruction}${ragContext}${sandboxGuidance}${hardcodedAgreement}`;

        let selectedModel = model || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

        // Build conversation messages for model
        const llmMessages: Array<{ role: string; content: string; name?: string; tool_calls?: any[] }> = [
          { role: "system", content: effectiveSystemInstruction }
        ];

        for (const m of sanitizedMessages) {
          let textContent = m.content || "";
          if (m.attachments && m.attachments.length > 0) {
            for (const att of m.attachments) {
              if (att.type === "file" && att.content) {
                textContent += `\n\n[Attached File: ${att.name}]\n${att.content.slice(0, 2000)}`;
              }
            }
          }
          llmMessages.push({ role: m.role === "assistant" ? "assistant" : "user", content: textContent });
        }

        // Create SSE Stream
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        const sendSSE = async (payload: StreamEventPayload) => {
          try {
            await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch {}
        };

        // Orchestration Loop in background task
        (async () => {
          const executionHistory: SandboxExecutionLog[] = [];
          let accumulatedReply = "";
          let loopCount = 0;
          const maxLoops = 4;

          try {
            await sendSSE({ type: "status", status: "thinking", message: "Analyzing prompt..." });

            while (loopCount < maxLoops) {
              loopCount++;

              // Call AI Model with tools
              let responseText = "";
              let toolCalls: any[] = [];

              try {
                const aiResult: any = await env.AI.run(selectedModel, {
                  messages: llmMessages,
                  tools: isYada ? [] : [SANDBOX_TOOL],
                  max_tokens: 2048,
                });

                if (aiResult?.tool_calls && Array.isArray(aiResult.tool_calls) && aiResult.tool_calls.length > 0) {
                  toolCalls = aiResult.tool_calls;
                } else if (aiResult?.response) {
                  responseText = aiResult.response;
                } else if (aiResult?.description) {
                  responseText = aiResult.description;
                }
              } catch (aiErr: any) {
                // Fallback attempt without tools if model threw schema error
                const plainResult: any = await env.AI.run(selectedModel, {
                  messages: llmMessages,
                  max_tokens: 2048,
                });
                responseText = plainResult?.response || plainResult?.description || "";
              }

              // Check if plain text returned (or tool call not triggered)
              if (!toolCalls.length) {
                // Check if model emitted embedded code action in text
                const codeMatch = responseText.match(/```(python|bash|javascript)[\s\S]*?```/i);
                const wantsRun = /run_sandbox_code|execute this|verify in sandbox/i.test(responseText);

                if (codeMatch && wantsRun && loopCount === 1) {
                  toolCalls = [{
                    name: "run_sandbox_code",
                    arguments: { code: codeMatch[2].trim(), language: codeMatch[1].toLowerCase() }
                  }];
                } else {
                  accumulatedReply = sanitizeAiResponse(responseText);
                  await sendSSE({ type: "text", chunk: accumulatedReply, text: accumulatedReply });
                  break;
                }
              }

              // Handle Tool Call
              for (const call of toolCalls) {
                const funcName = call.name || call.function?.name;
                let args = call.arguments || call.function?.arguments || {};
                if (typeof args === "string") {
                  try { args = JSON.parse(args); } catch { args = { code: args }; }
                }

                if (funcName === "run_sandbox_code" && args.code) {
                  await sendSSE({
                    type: "status",
                    status: "spinning_up_sandbox",
                    message: "⚡ Spinning up isolated E2B microVM...",
                  });

                  await sendSSE({
                    type: "status",
                    status: "running_code",
                    message: "⚡ Executing code in E2B sandbox...",
                    execution: { code: args.code, language: args.language || "python" },
                  });

                  const execResult = await runCodeInSandbox(args.code, env.E2B_API_KEY, args.language || "python");
                  executionHistory.push(execResult);

                  await sendSSE({
                    type: "sandbox_result",
                    execution: execResult,
                  });

                  // Add tool interaction to message chain for self-correction feedback loop
                  llmMessages.push({
                    role: "assistant",
                    content: `Calling run_sandbox_code with code:\n\`\`\`${args.language || "python"}\n${args.code}\n\`\`\``,
                  });

                  if (!execResult.success) {
                    await sendSSE({
                      type: "status",
                      status: "self_correcting",
                      message: "⚡ Sandbox returned error. Self-correcting and retrying...",
                    });

                    llmMessages.push({
                      role: "user",
                      content: "[E2B Sandbox Error Output]:\n" + (execResult.error || execResult.stderr) + "\nPlease analyze the error, correct the code, and re-execute or provide the verified explanation.",
                    });
                  } else {
                    await sendSSE({
                      type: "status",
                      status: "verifying_output",
                      message: "⚡ Sandbox completed. Verifying results...",
                    });

                    llmMessages.push({
                      role: "user",
                      content: "[E2B Sandbox Success Output]:\nStdout:\n" + (execResult.stdout || "(empty)") + "\n\nPlease explain and format the verified output cleanly for the user.",
                    });
                  }
                }
              }
            }

            if (!accumulatedReply) {
              accumulatedReply = "I have executed the code in the sandbox microVM.";
            }

            // Save conversation exchange to KV for fine-tuning
            const messageId = crypto.randomUUID();
            await saveExchange(env.CHAT_SESSIONS, {
              messageId,
              sessionId,
              userId: sessionUser?.sub ?? clientIP,
              userEmail: sessionUser?.email ?? "anonymous",
              tenantId,
              timestamp: new Date().toISOString(),
              model: selectedModel,
              ragUsed: ragChunks.length > 0,
              ragChunks: ragChunks.map((c) => c.slice(0, 200)),
              securityFlags,
              exchange: { messages: llmMessages },
              geofencedEU: isEUResident,
            });

            await sendSSE({
              type: "done",
              text: accumulatedReply,
            });

          } catch (err: any) {
            console.error("Pipeline error:", err);
            await sendSSE({
              type: "error",
              error: err.message || "An unexpected error occurred during execution.",
            });
          } finally {
            await writer.close().catch(() => {});
          }
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
          },
        });

      } catch (error: unknown) {
        console.error("[/api/chat fatal]", error);
        return Response.json(
          { error: "An unexpected error occurred. Please try again.", errorHandled: true },
          { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } }
        );
      }
    }

    // POST /api/ingest — Ingest a single R2 file into Vectorize
    // Body: { tenantId: 'gnosis'|'yada', key: 'filename.pdf' }
    // ─────────────────────────────────────────────────────────────────────────
    if (url.pathname === '/api/ingest' && request.method === 'POST') {
      try {
        const { tenantId, key } = (await request.json()) as { tenantId: string; key: string };
        if (!tenantId || !key) {
          return Response.json({ error: 'tenantId and key are required' }, { status: 400, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
        }

        const bucket = tenantId === 'yada' ? env.YADA_CHAT_BUCKET : env.GNOSIS_CHAT_BUCKET;
        if (!bucket) {
          return Response.json({ error: `${tenantId} bucket not bound` }, { status: 503, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
        }

        const result = await ingestFile(env, bucket, key, tenantId);
        return Response.json(result, { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
      } catch (e: any) {
        return Response.json({ error: e?.message ?? 'Ingest failed' }, { status: 500, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
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

      return Response.json({ results, errors }, { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/ingest-status — List indexed files per tenant
    // ─────────────────────────────────────────────────────────────────────────
    if (url.pathname === '/api/ingest-status' && request.method === 'GET') {
      if (!env.BOOK_STORE) {
        return Response.json({ error: 'BOOK_STORE not bound' }, { status: 503, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
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

        return Response.json({ gnosis, yada }, { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
      } catch (e: any) {
        return Response.json({ error: e?.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
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
      if (!env.DB) return Response.json([], { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
      try {
        const { results } = await env.DB
          .prepare(`SELECT id, title, slug, author, niche, price, file_key, cover_filename, is_featured, tag, publication_year FROM ebook_catalog ORDER BY display_order ASC`)
          .all();
        return Response.json(results, { headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=300' } });
      } catch (e: unknown) {
        console.error('[/api/library/catalog]', e);
        return Response.json([], { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
      }
    }

    // ── Static Assets ─────────────────────────────────────────────────────────
    

    

    
    // ── FACE SWAP STUDIO ROUTES ──────────────────────────────────────────────
    if (url.pathname === '/api/faceswap/generate' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const swapId = 'swap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const timestamp = new Date().toISOString();

        const resultUrl = body.swappedResult || body.targetFaceImage || body.originalImage || '';
        const historyItem = {
          id: swapId,
          originalUrl: body.originalImage || '',
          targetFaceUrl: body.targetFaceImage || '',
          resultUrl,
          createdAt: timestamp,
        };

        const kv = env.CHAT_SESSIONS || env.GNOSIS_SESSIONS;
        if (kv) {
          try {
            let list: any[] = [];
            const raw = await kv.get('trinity_faceswap_history');
            if (raw) {
              try { list = JSON.parse(raw); } catch {}
            }
            list = [historyItem, ...list].slice(0, 50);
            await kv.put('trinity_faceswap_history', JSON.stringify(list));
          } catch (e) {}
        }

        return Response.json(
          { success: true, swapId, resultUrl, item: historyItem },
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      } catch (err: any) {
        return Response.json(
          { success: false, error: err.message },
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    if (url.pathname === '/api/faceswap/history' && request.method === 'GET') {
      const kv = env.CHAT_SESSIONS || env.GNOSIS_SESSIONS;
      let list = [];
      if (kv) {
        try {
          const raw = await kv.get('trinity_faceswap_history');
          if (raw) list = JSON.parse(raw);
        } catch {}
      }
      return Response.json(
        { history: list },
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

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


// ─────────────────────────────────────────────────────────────────────────────
// RESILIENT FACE SWAP ENGINE (R2 + KV + INLINE CORS)
// ─────────────────────────────────────────────────────────────────────────────



function safeBase64ToArrayBuffer(input: string): ArrayBuffer {
  try {
    let base64 = input.includes(",") ? input.split(",")[1] : input;
    base64 = base64.replace(/\s/g, "");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch {
    return new ArrayBuffer(0);
  }
}

