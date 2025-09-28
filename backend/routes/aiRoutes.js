router.post("/risk-analysis", async (req, res) => {
  try {
    const { moodLogs } = req.body;

    const prompt = `
    You are a mental health AI assistant. Analyze these mood logs: ${JSON.stringify(moodLogs)}

    Respond ONLY in JSON format with this structure:

    {
      "wellnessIndex": number (0-100),
      "riskLevel": "LOW" | "MODERATE" | "SERIOUS",
      "summary": "string (2 lines max)",
      "suggestions": ["tip1", "tip2"]
    }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);  // ✅ try parsing Gemini’s output
    } catch (e) {
      console.warn("⚠️ AI response not JSON, returning raw");
      parsed = { wellnessIndex: 50, riskLevel: "MODERATE", summary: text, suggestions: [] };
    }

    res.json({
      date: new Date().toISOString(),
      ...parsed,   // ✅ structured values
    });

  } catch (err) {
    console.error("Gemini API error:", err.message, err.response?.data);
    res.status(500).json({ error: "AI analysis failed" });
  }
});
