// Shared HTTP helpers for the DocketShield API (Vercel Functions, Web Request/Response).

const MAX_JSON_BYTES = 8 * 1024 * 1024; // photos arrive base64-encoded

export function cors(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store",
    ...extra,
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: cors({ "content-type": "application/json" }) });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: cors() });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_JSON_BYTES) throw new HttpError(413, "Request too large (max 8 MB)");
  const text = await req.text();
  if (text.length > MAX_JSON_BYTES) throw new HttpError(413, "Request too large (max 8 MB)");
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error();
    return v as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Body must be a JSON object");
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Best-effort per-instance rate limit to protect the shared model quota. */
const hits = new Map<string, number[]>();
export function rateLimit(req: Request, limit: number, windowMs: number): void {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) throw new HttpError(429, "Too many requests, please wait a minute and try again");
  recent.push(now);
  hits.set(ip, recent);
}

export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      const msg = e instanceof Error ? e.message : "Unexpected error";
      // Validation errors from the engine are the caller's fault, not ours.
      if (/Expected a date|not a real calendar date/.test(msg)) return json({ error: msg }, 400);
      console.error(e);
      return json({ error: "Internal error" }, 500);
    }
  };
}
