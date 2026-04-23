// netlify/functions/votes.js
// GET /api/votes?session=xxx  → returns all votes for that session
// Response: { votes: { "PlayerName": "VotedFor", ... } }

import { getStore } from "@netlify/blobs";

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    // Don't cache — host needs fresh data every poll
    "Cache-Control": "no-store",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const url = new URL(req.url);
    const session = (url.searchParams.get("session") || "")
      .slice(0, 64)
      .replace(/[^a-z0-9_]/gi, "_");

    if (!session) {
      return new Response(JSON.stringify({ error: "Missing session" }), {
        status: 400, headers,
      });
    }

    const store = getStore("sank-votes");
    // List all keys that start with this session prefix
    const { blobs } = await store.list({ prefix: `${session}__` });

    const votes = {};
    for (const blob of blobs) {
      // key format: "session__VoterName"
      const voter = blob.key.slice(`${session}__`.length);
      const choice = await store.get(blob.key);
      if (voter && choice) votes[voter] = choice;
    }

    return new Response(JSON.stringify({ votes }), { status: 200, headers });
  } catch (err) {
    console.error("votes.js error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers,
    });
  }
};

export const config = { path: "/api/votes" };
