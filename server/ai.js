// Server-side AI integration. Keys are read from a per-user database setting or
// environment variables, and are never sent back to the browser. When no key is
// configured the local rule-based engine in model.js is used instead.

import { db } from "./db.js";

function extractJson(text) {
  if (!text) return null;
  let cleaned = String(text).trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

function userConfig(userId) {
  if (!userId) return null;
  try {
    return db.prepare("SELECT gemini_api_key, gemini_model FROM user_ai_settings WHERE user_id = ?").get(userId) || null;
  } catch { return null; }
}

export function resolveAiConfig(userId) {
  const saved = userConfig(userId);
  if (saved?.gemini_api_key) {
    return {
      provider: "gemini",
      source: "user",
      key: saved.gemini_api_key,
      model: saved.gemini_model || process.env.GEMINI_MODEL || "gemini-2.5-flash"
    };
  }
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: "gemini",
      source: "environment",
      key: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      source: "environment",
      key: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini"
    };
  }
  return { provider: "local", source: "none", key: null, model: null };
}

export function maskKey(key) {
  if (!key) return "";
  const value = String(key);
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 3)}…${value.slice(-4)}`;
}

// Lightweight metadata request: verifies the key and model access without
// spending a generation request. Returns null when connectivity is uncertain.
export async function validateGeminiKey(apiKey, model) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}?key=${encodeURIComponent(apiKey)}`, {
      headers: { "content-type": "application/json" }
    });
    if (res.ok) return true;
    if (res.status === 400 || res.status === 401 || res.status === 403) return false;
    return null;
  } catch { return null; }
}

async function gemini(system, user, key, model) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
    })
  });
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
  return extractJson(text);
}

async function openai(system, user, key, model) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" }, temperature: 0.4
    })
  });
  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
  const data = await res.json();
  return extractJson(data?.choices?.[0]?.message?.content);
}

export function aiProvider(userId) {
  return resolveAiConfig(userId).provider;
}

export async function callAIJson({ system, user, userId }) {
  const config = resolveAiConfig(userId);
  try {
    if (config.provider === "gemini") return await gemini(system, user, config.key, config.model);
    if (config.provider === "openai") return await openai(system, user, config.key, config.model);
  } catch (error) {
    console.error("[ai] provider error:", error.message);
  }
  return null;
}
