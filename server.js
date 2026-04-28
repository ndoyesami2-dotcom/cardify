const http = require("http");
const os = require("os");
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");

const ROOT = __dirname;
const BASE_PORT = parseInt(process.env.PORT, 10) || 3000;
const MAX_PORT_TRY = BASE_PORT + 25;
/** Listen on all interfaces so LAN phones and tools like ngrok can reach the server. Use BIND_HOST=127.0.0.1 to lock to localhost only. */
const BIND_HOST = process.env.BIND_HOST || "0.0.0.0";

function firstLanIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const fam = net.family;
      if ((fam === "IPv4" || fam === 4) && !net.internal) return net.address;
    }
  }
  return null;
}

function loadEnv() {
  try {
    const envPath = path.join(ROOT, ".env");
    if (!fsSync.existsSync(envPath)) return;
    const txt = fsSync.readFileSync(envPath, "utf8");
    for (const line of txt.split(/\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

let StripeSdk = null;
try {
  StripeSdk = require("stripe");
} catch {
  console.warn("Stripe package not installed; card checkout API disabled.");
}

let stripeClient = null;
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !StripeSdk) return null;
  if (!stripeClient) stripeClient = new StripeSdk(key);
  return stripeClient;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf"
};

function resolveSafePath(reqUrl) {
  let pathname;
  try {
    pathname = new URL(reqUrl, "http://127.0.0.1").pathname;
  } catch {
    return null;
  }

  let rel = pathname.replace(/^\/+/, "");
  if (!rel) rel = "index.html";
  if (rel.includes("..")) return null;
  try {
    rel = decodeURIComponent(rel);
  } catch {
    return null;
  }
  if (path.isAbsolute(rel)) return null;

  const joined = path.resolve(ROOT, rel);
  const rootResolved = path.resolve(ROOT);
  const prefix = rootResolved.endsWith(path.sep) ? rootResolved : rootResolved + path.sep;
  if (joined !== rootResolved && !joined.startsWith(prefix)) return null;

  return joined;
}

function resolveExistingFile(filePath) {
  if (fsSync.existsSync(filePath)) return filePath;

  if (!path.extname(filePath)) {
    const htmlPath = filePath + ".html";
    if (fsSync.existsSync(htmlPath)) return htmlPath;
  }

  const rootResolved = path.resolve(ROOT);
  const relative = path.relative(rootResolved, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return filePath;

  let cursor = rootResolved;
  for (const part of relative.split(path.sep)) {
    if (!part) continue;
    let entries;
    try {
      entries = fsSync.readdirSync(cursor);
    } catch {
      return filePath;
    }
    const match = entries.find((entry) => entry.toLowerCase() === part.toLowerCase());
    if (!match) return filePath;
    cursor = path.join(cursor, match);
  }
  if (fsSync.existsSync(cursor)) return cursor;
  if (!path.extname(cursor) && fsSync.existsSync(cursor + ".html")) return cursor + ".html";
  return filePath;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Cardify-Rel"
  };
}

/** Raw body for file uploads. */
function readBodyBuffer(req, maxSize) {
  return new Promise((resolve, reject) => {
    const parts = [];
    let total = 0;
    const max = Math.min(maxSize, 25 * 1024 * 1024);
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > max) {
        try {
          req.destroy();
        } catch {
          /* */
        }
        reject(new Error("body too large"));
        return;
      }
      parts.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(parts)));
    req.on("error", reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...corsHeaders()
  });
  res.end(body);
}

async function handleApi(req, res, pathname) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return true;
  }

  if (pathname === "/api/create-checkout-session" && req.method === "POST") {
    const stripe = getStripe();
    if (!stripe) {
      sendJson(res, 503, {
        error: "Stripe is not configured. Copy env.example to .env and set STRIPE_SECRET_KEY."
      });
      return true;
    }
    let payload;
    try {
      payload = JSON.parse((await readBody(req)) || "{}");
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body" });
      return true;
    }
    const amountFcfa = Math.max(0, Math.round(Number(payload.amountFcfa)));
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!amountFcfa) {
      sendJson(res, 400, { error: "amountFcfa must be a positive integer (FCFA / XOF)." });
      return true;
    }

    function normalizeSenegalMobile(input) {
      let d = String(input ?? "").replace(/\D/g, "");
      if (d.startsWith("221") && d.length >= 12) d = d.slice(3);
      if (d.length === 10 && d.startsWith("0")) d = d.slice(1);
      if (d.length === 9 && /^[37]\d{8}$/.test(d)) return d;
      return null;
    }
    let phoneDigits = "";
    const phoneRaw = payload.phone;
    if (phoneRaw != null && String(phoneRaw).trim() !== "") {
      const n = normalizeSenegalMobile(phoneRaw);
      if (!n) {
        sendJson(res, 400, {
          error:
            "phone must be a valid Senegal mobile number (9 digits after +221 if used, e.g. 77xxxxxxx)."
        });
        return true;
      }
      phoneDigits = n;
    }

    function compactItemsForStripeMetadata(arr) {
      const lines = (Array.isArray(arr) ? arr : []).map((it) => ({
        t: String(it.title ?? "").slice(0, 80),
        f: Math.max(0, Math.round(Number(it.fcfa) || 0)),
        q: Math.max(1, Math.round(Number(it.quantity) || 1))
      }));
      let json = JSON.stringify(lines);
      while (json.length > 500 && lines.length > 1) {
        lines.pop();
        json = JSON.stringify(lines);
      }
      while (json.length > 500 && lines[0] && lines[0].t.length > 0) {
        lines[0].t = lines[0].t.slice(0, -1);
        json = JSON.stringify(lines);
      }
      return json;
    }
    const orderItemsJson = compactItemsForStripeMetadata(items);

    const host = req.headers.host || `127.0.0.1:${BASE_PORT}`;
    const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const base = `${proto}://${host}`;
    const successPath = String(payload.successPath || "/checkout-success.html");
    const cancelPath = String(payload.cancelPath || "/checkout.html");
    const successUrl = `${base}${successPath.startsWith("/") ? "" : "/"}${successPath}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${base}${cancelPath.startsWith("/") ? "" : "/"}${cancelPath}`;

    const summary = items
      .map((it) => `${it.title || "Item"} × ${it.fcfa || 0}`)
      .join(" | ")
      .slice(0, 450);

    /* XOF/FCFA is often rejected by Stripe accounts (e.g. US). Default: charge in USD cents using FCFA÷STRIPE_FCFA_PER_USD. */
    const wantXof = String(process.env.STRIPE_CURRENCY || "").toLowerCase() === "xof";
    const fcfaPerUsd = Math.max(1, Number(process.env.STRIPE_FCFA_PER_USD || "600"));
    let currency = "usd";
    let unitAmount = Math.max(50, Math.round((amountFcfa / fcfaPerUsd) * 100));
    if (wantXof) {
      currency = "xof";
      unitAmount = amountFcfa;
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: "Cardify — gift card order",
                description: `${summary || "Digital gift cards"} — Total ${amountFcfa.toLocaleString()} FCFA (shop)`
              },
              unit_amount: unitAmount
            },
            quantity: 1
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          source: "cardify",
          item_count: String(items.length),
          order_summary: summary.slice(0, 450),
          amount_fcfa: String(amountFcfa),
          stripe_currency: currency,
          fcfa_per_usd_used: wantXof ? "" : String(fcfaPerUsd),
          customer_phone: phoneDigits,
          order_items_json: orderItemsJson
        }
      });
      sendJson(res, 200, { url: session.url, id: session.id });
    } catch (e) {
      const raw = e && e.raw && e.raw.message ? e.raw.message : e && e.message ? e.message : "Stripe error";
      console.error("[Stripe checkout]", raw, e && e.type);
      sendJson(res, 502, { error: raw });
    }
    return true;
  }

  /**
   * Dev/local: save activity feed file under ./activityFeed/ (public URL: /activityFeed/…).
   * Set CARDIFY_DISABLE_ACTIVITY_FILE_UPLOAD=1 in .env to turn off. Disable in production
   * if you expose this Node server to the public internet.
   */
  if (pathname === "/api/activity-feed-file" && req.method === "POST") {
    if (String(process.env.CARDIFY_DISABLE_ACTIVITY_FILE_UPLOAD) === "1") {
      sendJson(res, 404, { error: "local activity file upload is disabled" });
      return true;
    }
    let u;
    try {
      u = new URL(req.url, "http://127.0.0.1");
    } catch {
      sendJson(res, 400, { error: "invalid url" });
      return true;
    }
    const raw = (u.searchParams.get("path") || "").trim();
    if (!raw || /[\r\n\0]/.test(raw) || path.isAbsolute(raw)) {
      sendJson(res, 400, { error: "invalid path" });
      return true;
    }
    const segs = raw.split(/[/\\]+/).filter((s) => s);
    if (segs.length < 1 || segs[0] !== "activityFeed" || segs.some((s) => s === ".." || s === ".")) {
      sendJson(res, 400, { error: "path must be under activityFeed/…" });
      return true;
    }
    const abs = path.join(ROOT, ...segs);
    const under = path.join(ROOT, "activityFeed");
    const nAbs = path.normalize(path.resolve(abs));
    const nUnder = path.normalize(path.resolve(under));
    if (nAbs !== nUnder && !nAbs.startsWith(nUnder + path.sep)) {
      sendJson(res, 400, { error: "path must stay under activityFeed" });
      return true;
    }
    const rel = segs.join("/");
    let buf;
    try {
      buf = await readBodyBuffer(req, 25 * 1024 * 1024);
    } catch (e) {
      const err = (e && e.message) || "read failed";
      sendJson(res, 400, { error: err });
      return true;
    }
    if (!buf || buf.length < 1) {
      sendJson(res, 400, { error: "no file data" });
      return true;
    }
    try {
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, buf);
    } catch (e) {
      sendJson(res, 500, { error: e && e.message ? e.message : "write failed" });
      return true;
    }
    const publicPath = "/" + rel;
    sendJson(res, 200, { ok: true, url: publicPath });
    return true;
  }

  if (pathname === "/api/stripe-session" && req.method === "GET") {
    const stripe = getStripe();
    if (!stripe) {
      sendJson(res, 503, { error: "Stripe not configured" });
      return true;
    }
    let sessionId = "";
    try {
      sessionId = new URL(req.url, "http://127.0.0.1").searchParams.get("session_id") || "";
    } catch {
      sessionId = "";
    }
    if (!sessionId) {
      sendJson(res, 400, { error: "Missing session_id" });
      return true;
    }
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      sendJson(res, 200, {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata || {}
      });
    } catch (e) {
      sendJson(res, 400, { error: e && e.message ? e.message : "Invalid session" });
    }
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  let pathname = "/";
  try {
    pathname = new URL(req.url, "http://127.0.0.1").pathname;
  } catch {
    pathname = "/";
  }

  if (pathname.startsWith("/api/")) {
    const handled = await handleApi(req, res, pathname);
    if (handled) return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD, POST, OPTIONS" });
    res.end("Method Not Allowed");
    return;
  }

  const safePath = resolveSafePath(req.url);
  if (!safePath) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }
  const filePath = resolveExistingFile(safePath);

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";

    /** Inline PDF so browsers show it in-page (iframe/embed) instead of downloading. */
    const headers = {
      "Content-Type": type,
      "Cache-Control": "no-store"
    };
    if (ext === ".pdf") {
      headers["Content-Disposition"] = "inline";
    }

    res.writeHead(200, headers);

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    const body = await fs.readFile(filePath);
    res.end(body);
  } catch (e) {
    if (e && e.code === "ENOENT") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(500);
    res.end("Server error");
  }
});

function listenFrom(port) {
  server.once("error", (err) => {
    if (err && err.code === "EADDRINUSE" && port < MAX_PORT_TRY) {
      console.warn(`Port ${port} is in use, trying ${port + 1}…`);
      listenFrom(port + 1);
      return;
    }
    console.error(err);
    process.exit(1);
  });
  server.listen(port, BIND_HOST, () => {
    server.removeAllListeners("error");
    const loopback = `http://127.0.0.1:${port}`;
    const lan = firstLanIPv4();
    console.log("");
    console.log(`  Cardify is running on port ${port} (bind: ${BIND_HOST})`);
    console.log(`  On this PC:`);
    console.log(`    ${loopback}/index.html   (sign in)`);
    console.log(`    ${loopback}/home.html    (shop)`);
    console.log(`    ${loopback}/checkout.html`);
    if (lan) {
      console.log("");
      console.log(`  Same Wi‑Fi as this PC (no ngrok): open on your phone`);
      console.log(`    http://${lan}:${port}/home.html`);
    }
    console.log("");
    console.log(`  With ngrok: run exactly  ngrok http ${port}`);
    console.log(`  Then on your phone open the full https URL including path, e.g.`);
    console.log(`    https://YOUR-SUBDOMAIN.ngrok-free.dev/home.html`);
    console.log(`  Free ngrok shows a warning page first — tap “Visit Site”.`);
    console.log(`  Firebase sign-in: add YOUR-SUBDOMAIN.ngrok-free.dev under`);
    console.log(`  Authentication → Settings → Authorized domains.`);
    console.log("");
    console.log("Press Ctrl+C to stop.");
  });
}

listenFrom(BASE_PORT);
