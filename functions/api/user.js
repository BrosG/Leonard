// User profile CRUD via Prisma + D1
export async function onRequestGet(context) {
  const { env, data } = context;
  const user = data.user;

  try {
    const result = await env.DB.prepare("SELECT * FROM User WHERE firebaseUid = ?").bind(user.uid).first();

    if (!result) {
      // Auto-create user on first API call
      await env.DB.prepare(
        "INSERT INTO User (firebaseUid, email, phone, displayName, photoUrl, provider, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
      )
        .bind(user.uid, user.email, user.phone, user.name, user.picture, user.provider)
        .run();

      const newUser = await env.DB.prepare("SELECT * FROM User WHERE firebaseUid = ?").bind(user.uid).first();
      return Response.json({ user: newUser, isNew: true });
    }

    return Response.json({ user: result, isNew: false });
  } catch (error) {
    console.error("User API error:", error);
    return Response.json({ error: "Failed to fetch user profile", details: error.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env, data } = context;
  const user = data.user;

  try {
    const body = await request.json();
    const { displayName, yachtName, yachtType, yachtLength, homePort, preferences } = body;

    await env.DB.prepare(
      "UPDATE User SET displayName = COALESCE(?, displayName), yachtName = COALESCE(?, yachtName), yachtType = COALESCE(?, yachtType), yachtLength = COALESCE(?, yachtLength), homePort = COALESCE(?, homePort), preferences = COALESCE(?, preferences), updatedAt = datetime('now') WHERE firebaseUid = ?"
    )
      .bind(displayName, yachtName, yachtType, yachtLength, homePort, preferences ? JSON.stringify(preferences) : null, user.uid)
      .run();

    const updated = await env.DB.prepare("SELECT * FROM User WHERE firebaseUid = ?").bind(user.uid).first();
    return Response.json({ user: updated });
  } catch (error) {
    console.error("User update error:", error);
    return Response.json({ error: "Failed to update user profile", details: error.message }, { status: 500 });
  }
}
