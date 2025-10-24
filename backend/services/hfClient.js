// services/hfClient.js (fixed + safer)
import axios from "axios";

const HF_API_URL = "https://api-inference.huggingface.co/models";

export async function classifyText({ text, modelId, hfToken }) {
  if (!hfToken) throw new Error("❌ HF token missing");
  if (!text?.trim()) return [];

  const url = `${HF_API_URL}/${modelId}`;
  const headers = { Authorization: `Bearer ${hfToken}` };

  try {
    const { data } = await axios.post(
      url,
      { inputs: text },
      { headers, timeout: 15000 }
    );

    // 🧠 Debug output
    console.log("🧪 HF raw data:", JSON.stringify(data, null, 2));

    // Case 1: [[{label, score}]]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0];
    }

    // Case 2: [{label, score}]
    if (Array.isArray(data)) {
      return data;
    }

    // Case 3: Error or loading state
    if (data && data.error) {
      console.warn("⚠️ HF model warming up:", data.error);
      return [];
    }

    console.warn("⚠️ Unexpected HF response format:", data);
    return [];
  } catch (err) {
    console.error("❌ HF API error:", err.message);
    return [];
  }
}

export default classifyText;
