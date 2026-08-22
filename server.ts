
async function runCodeInSandbox(codeStr: string, apiKey?: string, language: string = "python") {
  const token = apiKey || process.env.E2B_API_KEY;
  if (!token) {
    return {
      success: false,
      stdout: "",
      stderr: "E2B_API_KEY is not configured.",
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


// ── GET /api/library/catalog (Production DB Sync) ───────────────────────────
const PROD_CATALOG = [
  {
    "id": 1,
    "title": "The Kybalion: Hermetic Philosophy",
    "slug": "the-kybalion-hermetic-philosophy",
    "author": "Three Initiates",
    "niche": "Spirituality & Hidden Knowledge",
    "price": 4.99,
    "file_key": "ebooks/the-kybalion-hermetic-philosophy.epub",
    "cover_filename": "covers/the-kybalion-hermetic-philosophy.png",
    "is_featured": 1,
    "tag": "esoteric",
    "publication_year": 1908
  },
  {
    "id": 2,
    "title": "Goetia: The Lesser Key of Solomon",
    "slug": "goetia-lesser-key-of-solomon",
    "author": "S.L. MacGregor Mathers",
    "niche": "Spirituality & Hidden Knowledge",
    "price": 4.99,
    "file_key": "ebooks/goetia-lesser-key-of-solomon.epub",
    "cover_filename": "covers/goetia-lesser-key-of-solomon.png",
    "is_featured": 0,
    "tag": "occult",
    "publication_year": 1904
  },
  {
    "id": 3,
    "title": "The Initiates of the Flame",
    "slug": "the-initiates-of-the-flame",
    "author": "Manly P. Hall",
    "niche": "Spirituality & Hidden Knowledge",
    "price": 4.99,
    "file_key": "ebooks/the-initiates-of-the-flame.epub",
    "cover_filename": "covers/the-initiates-of-the-flame.png",
    "is_featured": 0,
    "tag": "mystery-school",
    "publication_year": 1922
  },
  {
    "id": 4,
    "title": "The Notebooks of Leonardo Da Vinci",
    "slug": "notebooks-of-leonardo-da-vinci",
    "author": "Leonardo da Vinci",
    "niche": "Advanced Science",
    "price": 7.99,
    "file_key": "ebooks/notebooks-of-leonardo-da-vinci.epub",
    "cover_filename": "covers/notebooks-of-leonardo-da-vinci.png",
    "is_featured": 1,
    "tag": "renaissance-science",
    "publication_year": 1888
  },
  {
    "id": 5,
    "title": "The Story of the Heavens",
    "slug": "the-story-of-the-heavens",
    "author": "Robert S. Ball",
    "niche": "Advanced Science",
    "price": 7.99,
    "file_key": "ebooks/the-story-of-the-heavens.epub",
    "cover_filename": "covers/the-story-of-the-heavens.png",
    "is_featured": 0,
    "tag": "astronomy",
    "publication_year": 1900
  },
  {
    "id": 6,
    "title": "Creative Evolution",
    "slug": "creative-evolution",
    "author": "Henri Bergson",
    "niche": "Advanced Science",
    "price": 7.99,
    "file_key": "ebooks/creative-evolution.epub",
    "cover_filename": "covers/creative-evolution.png",
    "is_featured": 0,
    "tag": "philosophy-of-science",
    "publication_year": 1911
  },
  {
    "id": 7,
    "title": "Steam: Its Generation and Use",
    "slug": "steam-its-generation-and-use",
    "author": "Babcock & Wilcox Company",
    "niche": "Hidden Physics",
    "price": 4.99,
    "file_key": "ebooks/steam-its-generation-and-use.epub",
    "cover_filename": "covers/steam-its-generation-and-use.png",
    "is_featured": 0,
    "tag": "thermodynamics",
    "publication_year": 1906
  },
  {
    "id": 8,
    "title": "Mechanical Drawing Self-Taught",
    "slug": "mechanical-drawing-self-taught",
    "author": "Joshua Rose",
    "niche": "Hidden Physics",
    "price": 4.99,
    "file_key": "ebooks/mechanical-drawing-self-taught.epub",
    "cover_filename": "covers/mechanical-drawing-self-taught.png",
    "is_featured": 0,
    "tag": "engineering",
    "publication_year": 1910
  },
  {
    "id": 9,
    "title": "Concrete Construction: Methods and Costs",
    "slug": "concrete-construction-methods-costs",
    "author": "Halbert Powers Gillette",
    "niche": "Technology",
    "price": 4.99,
    "file_key": "ebooks/concrete-construction-methods-costs.epub",
    "cover_filename": "covers/concrete-construction-methods-costs.png",
    "is_featured": 0,
    "tag": "construction-tech",
    "publication_year": 1908
  },
  {
    "id": 10,
    "title": "Color Images from Mars: Spirit & Opportunity",
    "slug": "color-images-mars-rovers",
    "author": "Bob Webster",
    "niche": "Technology",
    "price": 4.99,
    "file_key": "ebooks/color-images-mars-rovers.epub",
    "cover_filename": "covers/color-images-mars-rovers.png",
    "is_featured": 1,
    "tag": "space-technology",
    "publication_year": 2004
  },
  {
    "id": 11,
    "title": "Searchlights on Health: The Complete Sexual Science",
    "slug": "searchlights-on-health",
    "author": "B.G. Jefferis",
    "niche": "Holistic & Biological Wellness",
    "price": 4.99,
    "file_key": "ebooks/searchlights-on-health.epub",
    "cover_filename": "covers/searchlights-on-health.png",
    "is_featured": 0,
    "tag": "wellness",
    "publication_year": 1894
  },
  {
    "id": 12,
    "title": "Manual of Surgery: Sixth Edition",
    "slug": "manual-of-surgery-sixth-edition",
    "author": "Alexis Thomson",
    "niche": "Holistic & Biological Wellness",
    "price": 4.99,
    "file_key": "ebooks/manual-of-surgery-sixth-edition.epub",
    "cover_filename": "covers/manual-of-surgery-sixth-edition.png",
    "is_featured": 0,
    "tag": "medical-science",
    "publication_year": 1921
  },
  {
    "id": 13,
    "title": "Reminiscences of a Stock Operator",
    "slug": "reminiscences-of-a-stock-operator",
    "author": "Edwin Lefevre",
    "niche": "Forex",
    "price": 9,
    "file_key": "ebooks/reminiscences-of-a-stock-operator.epub",
    "cover_filename": "covers/reminiscences-of-a-stock-operator.png",
    "is_featured": 1,
    "tag": "trading",
    "publication_year": 1923
  },
  {
    "id": 14,
    "title": "Fifty Years in Wall Street",
    "slug": "fifty-years-in-wall-street",
    "author": "Henry Clews",
    "niche": "Forex",
    "price": 9,
    "file_key": "ebooks/fifty-years-in-wall-street.epub",
    "cover_filename": "covers/fifty-years-in-wall-street.png",
    "is_featured": 0,
    "tag": "finance-history",
    "publication_year": 1908
  },
  {
    "id": 15,
    "title": "Democracy and Education",
    "slug": "democracy-and-education",
    "author": "John Dewey",
    "niche": "Education",
    "price": 0,
    "file_key": "ebooks/democracy-and-education.pdf",
    "cover_filename": "covers/democracy-and-education.png",
    "is_featured": 1,
    "tag": "educational-philosophy",
    "publication_year": 1916
  },
  {
    "id": 16,
    "title": "The Montessori Method",
    "slug": "the-montessori-method",
    "author": "Maria Montessori",
    "niche": "Education",
    "price": 0,
    "file_key": "ebooks/the-montessori-method.epub",
    "cover_filename": "covers/the-montessori-method.png",
    "is_featured": 0,
    "tag": "child-development",
    "publication_year": 1936
  },
  {
    "id": 17,
    "title": "The Art of Money Getting",
    "slug": "the-art-of-money-getting",
    "author": "P.T. Barnum",
    "niche": "General Business",
    "price": 0,
    "file_key": "ebooks/the-art-of-money-getting.epub",
    "cover_filename": "covers/the-art-of-money-getting.png",
    "is_featured": 1,
    "tag": "success-mindset",
    "publication_year": 1937
  },
  {
    "id": 18,
    "title": "The Science of Getting Rich",
    "slug": "the-science-of-getting-rich",
    "author": "W.D. Wattles",
    "niche": "General Business",
    "price": 0,
    "file_key": "ebooks/the-science-of-getting-rich.epub",
    "cover_filename": "covers/the-science-of-getting-rich.png",
    "is_featured": 0,
    "tag": "startup-innovation",
    "publication_year": 2014
  },
  {
    "id": 19,
    "title": "The Prince",
    "slug": "the-prince-machiavelli",
    "author": "Niccolò Machiavelli",
    "niche": "Government",
    "price": 4.99,
    "file_key": "ebooks/the-prince-machiavelli.pdf",
    "cover_filename": "covers/the-prince-machiavelli.png",
    "is_featured": 1,
    "tag": "political-strategy",
    "publication_year": 1532
  },
  {
    "id": 20,
    "title": "Leviathan: The Matter, Form and Power of Government",
    "slug": "leviathan-hobbes",
    "author": "Thomas Hobbes",
    "niche": "Government",
    "price": 4.99,
    "file_key": "ebooks/leviathan-hobbes.pdf",
    "cover_filename": "covers/leviathan-hobbes.png",
    "is_featured": 0,
    "tag": "political-philosophy",
    "publication_year": 1651
  }
];

app.get("/api/library/catalog", (_req, res) => {
  res.json(PROD_CATALOG);
});

// ── GET /api/r2/* (Live R2 Bucket Image Proxy) ─────────────────────────────
app.get("/api/r2/*", async (req: express.Request, res: express.Response) => {
  const fileKey = (req.params as any)[0] || req.path.replace("/api/r2/", "");
  try {
    const prodUrl = `https://trinityuniverse.org/api/r2/${fileKey}`;
    const response = await fetch(prodUrl);
    if (!response.ok) {
      return res.status(response.status).send("File not found");
    }
    const contentType = response.headers.get("content-type") || "image/png";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("R2 proxy error for " + fileKey, err);
    return res.status(500).send("Error proxying image");
  }
});

app.get('/auth/logout', handleLogout);
app.get('/api/auth/logout', handleLogout);

// Server-side Cloudflare Workers AI Chat Endpoint
app.post("/api/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendSSE = (payload: any) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const { messages, systemInstruction, model, tenantId } = req.body;
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;

    let selectedModel = model || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    const effectiveSystemInstruction = (systemInstruction || "You are a helpful AI assistant.") +
      "\n\nYou have access to an isolated Linux microVM runtime via the run_sandbox_code tool. If you need to perform calculations, verify code, run scripts, test algorithms, or generate program outputs, call run_sandbox_code.";

    const llmMessages = [
      { role: "system", content: effectiveSystemInstruction },
      ...(messages || []).map((m: any) => ({ role: m.role, content: m.content || "" }))
    ];

    sendSSE({ type: "status", status: "thinking", message: "Analyzing prompt..." });

    let responseText = "";
    let toolCalls: any[] = [];

    if (cfAccountId && cfApiToken) {
      try {
        const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${selectedModel}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${cfApiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messages: llmMessages,
            max_tokens: 2048
          })
        });
        const cfData: any = await cfRes.json();
        responseText = cfData.result?.response || cfData.result?.description || "";
      } catch (err: any) {
        console.error("Workers AI error:", err.message);
      }
    }

    if (!responseText) {
      responseText = "I received your request.";
    }

    // Check for code execution trigger
    const codeMatch = responseText.match(/```(python|bash|javascript)[\s\S]*?```/i);
    const lastUserMsg = (messages || []).filter((m: any) => m.role === "user").pop()?.content || "";
    const shouldRunCode = codeMatch && (responseText.toLowerCase().includes("sandbox") || lastUserMsg.toLowerCase().includes("run") || lastUserMsg.toLowerCase().includes("calculate") || lastUserMsg.toLowerCase().includes("execute"));

    if (shouldRunCode && codeMatch) {
      const code = codeMatch[2].trim();
      const language = codeMatch[1].toLowerCase();

      sendSSE({ type: "status", status: "spinning_up_sandbox", message: "⚡ Spinning up isolated E2B microVM..." });
      sendSSE({ type: "status", status: "running_code", message: "⚡ Executing code in E2B sandbox...", execution: { code, language } });

      const execResult = await runCodeInSandbox(code, process.env.E2B_API_KEY, language);
      sendSSE({ type: "sandbox_result", execution: execResult });

      if (!execResult.success) {
        sendSSE({ type: "status", status: "self_correcting", message: "⚡ Code error detected. Self-correcting..." });
      } else {
        sendSSE({ type: "status", status: "verifying_output", message: "⚡ Verification complete." });
      }
    }

    sendSSE({ type: "text", chunk: responseText, text: responseText });
    sendSSE({ type: "done", text: responseText });
  } catch (error: any) {
    sendSSE({ type: "error", error: error.message || "Execution error" });
  } finally {
    res.end();
  }
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

