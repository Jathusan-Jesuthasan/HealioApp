import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chatWithLLM } from "../services/llmClient";
import api from "../config/api";

/* ---------------- constants ---------------- */
const BG = "#F6F7FB";
const BOT = "#EAF1FF";
const USER = "#EAFBF2";
const FOOTER_HEIGHT = 64;
const INPUT_MIN = 44;
const INPUT_MAX = 120;

/* ---------------- crisis keywords ---------------- */
const crisisKeywords = [
  "suicide",
  "kill myself",
  "end my life",
  "hurt myself",
  "die",
  "self harm",
];

/* ---------------- date label helper ---------------- */
const dayLabel = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yday)) return "Yesterday";
  return d.toLocaleDateString();
};

export default function ChatbotScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [inputHeight, setInputHeight] = useState(INPUT_MIN);

  const userId = "demo_user"; // replace with auth user later

  const scrollToBottom = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  /* ---------- Load chat history ---------- */
  useEffect(() => {
    const loadChat = async () => {
      try {
        const res = await api.get(`/api/chat/${userId}`);
        if (res.data?.data?.length) {
          setMessages(
            res.data.data.map((m) => ({
              id: m._id,
              role: m.role,
              text: m.text,
              ts: new Date(m.createdAt).getTime(),
            }))
          );
        } else {
          setMessages([
            {
              id: String(Date.now()),
              role: "bot",
              text:
                "Welcome to Healio Chat 🤖\nI’m a motivational, non-clinical companion. Tell me how you’re doing, and I’ll suggest gentle next steps.",
              ts: Date.now(),
            },
          ]);
        }
        setShowHero(true);
      } catch (err) {
        console.log("⚠️ Could not load chat:", err.message);
      }
    };
    loadChat();
  }, []);

  /* ---------- Save message ---------- */
  const saveMessageToDB = async (role, text) => {
    try {
      await api.post("/api/chat/add", { userId, role, text });
    } catch (err) {
      console.log("❌ Chat save failed:", err.message);
    }
  };

  /* ---------- Add message locally + save ---------- */
  const addMsg = (role, content) => {
    const m = { id: String(Date.now() + Math.random()), role, text: content, ts: Date.now() };
    setMessages((prev) => [...prev, m]);
    saveMessageToDB(role, content);
  };

  const addChips = (chips) =>
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), role: "chips", chips, ts: Date.now() },
    ]);

  /* ---------- Handle send ---------- */
  const handleSend = async () => {
    const input = text.trim();
    if (!input) return;

    if (showHero) setShowHero(false);
    addMsg("user", input);
    setText("");
    setInputHeight(INPUT_MIN);
    setTyping(true);
    scrollToBottom();

    /* ---------- Crisis check ---------- */
    if (crisisKeywords.some((k) => input.toLowerCase().includes(k))) {
      addMsg(
        "bot",
        "💛 I'm really concerned. Please reach out for immediate help. In Sri Lanka, call CCCline at 1333 or Sumithrayo at +94 11 2 682535."
      );
      addChips(["Call Helpline", "Talk to a Friend", "Relaxation Exercise"]);
      setTyping(false);
      return;
    }

    /* ---------- Prepare messages for LLM ---------- */
    const historyForLLM = messages
      .filter((m) => m.role === "user" || m.role === "bot")
      .slice(-10)
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

    const llmMessages = [
      {
        role: "system",
        content: `
          You are Healio, a kind, motivational, non-clinical mental wellness companion.
          Only respond to mental health, mood, motivation, stress relief, or mindfulness topics.
          If the user asks unrelated topics, gently redirect back to mental wellbeing.
          Keep responses empathetic, short (2-3 sentences), and suggest one small helpful action.
        `,
      },
      ...historyForLLM,
      { role: "user", content: input },
    ];

    /* ---------- Get LLM reply ---------- */
    const replyText = await chatWithLLM(llmMessages);
    addMsg(
      "bot",
      replyText ||
        "Thanks for sharing 🌿. I’m here to support mental wellbeing. Try a quick breathing exercise, journaling, or setting a small goal."
    );
    addChips(["Start Meditation", "Open Journal", "Set a Goal"]);
    setTyping(false);
    scrollToBottom();
  };

  /* ---------- Quick action chips ---------- */
  const onTapChip = (chip) => {
    const map = {
      "Start Meditation": () => navigation.navigate("Meditation"),
      "Breathing 4-7-8": () => navigation.navigate("Meditation"),
      "Grounding Exercise": () => navigation.navigate("Meditation"),
      "Open Journal": () => navigation.navigate("Journal"),
      "Log Mood": () => navigation.navigate("ActivityDetail", { activity: "Journaling" }),
      "Set a Goal": () => navigation.navigate("GoalSetup"),
      "View Progress": () => navigation.navigate("Progress"),
      "Call a Friend": () => addMsg("bot", "Consider reaching someone you trust. You matter 💛"),
    };
    (map[chip] || (() => addMsg("bot", "On it!")))();
    scrollToBottom();
  };

  /* ---------- Group messages by date ---------- */
  const sections = [];
  let lastLabel = "";
  messages.forEach((m) => {
    const label = dayLabel(m.ts || Date.now());
    if (label !== lastLabel) {
      sections.push({ type: "sep", id: `sep_${label}_${m.ts || Math.random()}`, label });
      lastLabel = label;
    }
    sections.push({ type: "msg", ...m });
  });

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image source={require("../assets/robo4.jpg")} style={styles.avatar} />
          <Text style={styles.headerTitle}>Healio AI Chatbot</Text>
        </View>
      </View>

      {/* Chat Area */}
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 14,
            paddingTop: 6,
            paddingBottom: FOOTER_HEIGHT + 120,
          }}
          onContentSizeChange={scrollToBottom}
        >
          {sections.map((it) =>
            it.type === "sep" ? (
              <View key={it.id} style={styles.separator}>
                <Text style={styles.separatorText}>{it.label}</Text>
              </View>
            ) : it.role === "chips" ? (
              <View key={it.id} style={styles.chipsRow}>
                {it.chips.map((c) => (
                  <TouchableOpacity key={c} style={styles.chip} onPress={() => onTapChip(c)}>
                    <Text style={styles.chipText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View
                key={it.id}
                style={[styles.bubbleRow, it.role === "user" ? { justifyContent: "flex-end" } : null]}
              >
                <View style={[styles.bubble, it.role === "user" ? styles.userBubble : styles.botBubble]}>
                  <Text style={[styles.bubbleText, it.role === "user" ? styles.userText : styles.botText]}>
                    {it.text}
                  </Text>
                </View>
              </View>
            )
          )}

          {typing && (
            <View style={styles.typingWrap}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <Text style={{ marginLeft: 8, color: "#6B7280" }}>typing…</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputBarContainer, { paddingBottom: insets.bottom + 70 }]}>
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.6}>
              <Text style={{ fontSize: 18 }}>＋</Text>
            </TouchableOpacity>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message…"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, { height: Math.min(Math.max(INPUT_MIN, inputHeight), INPUT_MAX) }]}
              multiline
              numberOfLines={1}
              maxLength={2000}
              returnKeyType="send"
              onFocus={() => showHero && setShowHero(false)}
              onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
              onSubmitEditing={() => text.trim() && handleSend()}
            />

            <TouchableOpacity
              style={[styles.sendBtn, { opacity: text.trim() ? 1 : 0.5 }]}
              onPress={handleSend}
              disabled={!text.trim()}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  headerCard: {
    backgroundColor: "#E9F2FF",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6E6FF",
  },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  separator: {
    alignSelf: "center",
    backgroundColor: "#EEF2FF",
    borderColor: "#DDE3FF",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginVertical: 10,
  },
  separatorText: { color: "#4C5A7D", fontWeight: "700", fontSize: 11 },
  bubbleRow: { paddingVertical: 6, flexDirection: "row" },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  botBubble: { backgroundColor: BOT, borderColor: "#CFE0FF" },
  userBubble: { backgroundColor: USER, borderColor: "#CDEFD7" },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  botText: { color: "#0F172A" },
  userText: { color: "#0B5F42" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 4 },
  chip: {
    backgroundColor: "#ffffff",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: "#0F172A", fontWeight: "700", fontSize: 12 },
  inputBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BG,
    paddingHorizontal: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: "#0F172A",
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 4,
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: "#3B82F6",
    height: 42,
    minWidth: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    marginLeft: 4,
  },
  typingWrap: { flexDirection: "row", alignItems: "center", paddingLeft: 8, paddingTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#9CA3AF", marginHorizontal: 2 },
});
