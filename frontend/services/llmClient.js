const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";
import { loadApiKey } from "./secretStore";

let hasWarned = false;
let cachedKey = null;

export async function chatWithLLM(messages) {
  if (!cachedKey) cachedKey = await loadApiKey();
  const apiKey = cachedKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY; // still support env var if present
  if (!apiKey) return null;

  const safeMessages = (messages || []).filter(
    (m) => m && typeof m.content === "string" && m.content.trim().length > 0
  );
  if (!safeMessages.length) return null;

  try {
    const res = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: OPENAI_MODEL, temperature: 0.7, messages: safeMessages }),
    });

    if (!res.ok) {
      if (!hasWarned) {
        const msg = await res.text();
        console.warn("LLM error (disabled, using rules):", msg);
        hasWarned = true;
      }
      return null;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim?.();
    return text || null;
  } catch (e) {
    if (!hasWarned) {
      console.warn("LLM call failed (using rules):", e?.message);
      hasWarned = true;
    }
    return null;
  }
}
