// netlify/functions/vote.js
// POST /api/vote  → { session, voter, choice }

import { getStore } from "@netlify/blobs";

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  try {
    const { session, voter, choice } = await req.json();
    if (!session || !voter || !choice) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers });
    }

    const store = getStore("sank-votes");
    const key = String(session).slice(0, 64);

    // Read existing votes for this session, add the new one, save back
    let votes = {};
    try {
      const existing = await store.get(key, { type: "json" });
      if (existing) votes = existing;
    } catch (e) { /* no votes yet — start fresh */ }

    votes[String(voter).slice(0, 32)] = String(choice).slice(0, 32);
    await store.setJSON(key, votes);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    console.error("vote error:", err);
    return new Response(JSON.stringify({ error: String(err.message) }), { status: 500, headers });
  }
};

export const config = { path: "/api/vote" };

