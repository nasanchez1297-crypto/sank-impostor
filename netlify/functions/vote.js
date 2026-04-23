// netlify/functions/vote.js
// POST /api/vote  → saves one player's vote
// Body: { session, voter, choice }

import { getStore } from "@netlify/blobs";

export default async (req) => {
  // CORS — allow the game page to call this from any origin
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers,
    });
  }

  try {
    const { session, voter, choice } = await req.json();

    if (!session || !voter || !choice) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers,
      });
    }

    // Sanitize inputs
    const safeSession = String(session).slice(0, 64).replace(/[^a-z0-9_]/gi, "_");
    const safeVoter   = String(voter).slice(0, 32);
    const safeChoice  = String(choice).slice(0, 32);

    // Store vote: key = "session_voter", value = choice
    const store = getStore("sank-votes");
    await store.set(`${safeSession}__${safeVoter}`, safeChoice, {
      metadata: { ts: Date.now() },
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    console.error("vote.js error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers,
    });
  }
};

export const config = { path: "/api/vote" };
