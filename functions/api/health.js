export async function onRequestGet() {
  return Response.json({ status: "ok", service: "leonard-api", timestamp: new Date().toISOString() });
}
