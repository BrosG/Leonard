// Auth middleware for API routes
// Verifies Firebase ID tokens on protected endpoints

const GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT");
  return JSON.parse(base64UrlDecode(parts[1]));
}

async function verifyFirebaseToken(token, projectId) {
  try {
    const payload = decodeJwtPayload(token);

    // Basic validation
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) throw new Error("Token expired");
    if (payload.iat > now + 300) throw new Error("Token issued in the future");
    if (payload.aud !== projectId) throw new Error("Invalid audience");
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("Invalid issuer");
    if (!payload.sub || typeof payload.sub !== "string") throw new Error("Invalid subject");

    return payload;
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return null;
  }
}

// Public endpoints that don't require auth
const PUBLIC_PATHS = ["/api/health"];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Allow public endpoints
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Check for auth token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const projectId = env.FIREBASE_PROJECT_ID || "leonardaccess-233f8";
  const payload = await verifyFirebaseToken(token, projectId);

  if (!payload) {
    return Response.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // Attach user info to the request context
  context.data = context.data || {};
  context.data.user = {
    uid: payload.sub,
    email: payload.email || null,
    phone: payload.phone_number || null,
    name: payload.name || null,
    picture: payload.picture || null,
    provider: payload.firebase?.sign_in_provider || "unknown",
  };

  // Add CORS headers to the response
  const response = await next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
