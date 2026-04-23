// netlify/functions/votes.js
// GET /api/votes?session=xxx  → { votes: { "PlayerName": "VotedFor", ... } }

import { getStore } from "@netlify/blobs";

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  try {
    const url = new URL(req.url);
    const session = (url.searchParams.get("session") || "").slice(0, 64);
    if (!session) {
      return new Response(JSON.stringify({ error: "Missing session" }), { status: 400, headers });
    }

    const store = getStore("sank-votes");
    let votes = {};
    try {
      const data = await store.get(session, { type: "json" });
      if (data) votes = data;
    } catch (e) { /* no votes yet */ }

    return new Response(JSON.stringify({ votes }), { status: 200, headers });
  } catch (err) {
    console.error("votes error:", err);
    return new Response(JSON.stringify({ error: String(err.message) }), { status: 500, headers });
  }
};

export const config = { path: "/api/votes" };

