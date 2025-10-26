const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";
import { loadApiKey } from "./secretStore";

let hasWarned = false;
let cachedKey = null;

export function resetApiKeyCache() {
  cachedKey = null;
  hasWarned = false;
}

export async function chatWithLLM(messages) {
  if (!cachedKey) {
    try {
      cachedKey = await loadApiKey();
    } catch (err) {
      cachedKey = null;
      if (!hasWarned) {
        console.warn("Secure store lookup failed:", err?.message || err);
        hasWarned = true;
      }
    }
  }

  const envKey = typeof process !== "undefined" ? process?.env?.EXPO_PUBLIC_OPENAI_API_KEY : undefined;
  const apiKey = cachedKey || envKey;

  if (!apiKey) {
    const err = new Error("Missing OpenAI API key");
    err.code = "missing-api-key";
    throw err;
  }

  const safeMessages = (messages || []).filter(
    (m) => m && typeof m.content === "string" && m.content.trim().length > 0
  );

  if (!safeMessages.length) {
    const err = new Error("No messages to send to LLM");
    err.code = "invalid-payload";
    throw err;
  }

  try {
    const res = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: OPENAI_MODEL, temperature: 0.7, messages: safeMessages }),
    });

    if (!res.ok) {
      const msg = await res.text();
      const err = new Error(msg || `OpenAI request failed with status ${res.status}`);
      err.code = res.status === 401 ? "unauthorized" : "llm-request-failed";
      err.status = res.status;
      if (err.code === "unauthorized") {
        resetApiKeyCache();
      }
      throw err;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim?.();
    return text || null;
  } catch (e) {
    if (!hasWarned) {
      console.warn("LLM call failed:", e?.message || e);
      hasWarned = true;
    }
    throw e;
  }
}