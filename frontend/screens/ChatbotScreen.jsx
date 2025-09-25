// screens/ChatbotScreen.jsx
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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Footer from "../components/BottomBar.jsx";
import { chatWithLLM } from "../services/llmClient.js";

/* ---------------- rules (unchanged) ---------------- */
const norm = (s = "") =>
  s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

const rules = [
  {
    match: (t) => /\b(hi|hello|hey)\b/.test(t),
    reply:
      "Hey there! 👋 I’m your Healio helper. How are you feeling today—okay, good, or not so great?",
    chips: ["Start Meditation", "Open Journal", "Set a Goal"],
  },
  {
    match: (t) => /\b(stress|stressed|overwhelmed|anxious|anxiety)\b/.test(t),
    reply:
      "That sounds heavy. Let’s try 5 minutes of breathing or a short stretch. I can also log your mood so we can spot patterns later.",
    chips: ["Start Meditation", "Open Journal", "Log Mood"],
  },
  {
    match: (t) =>
      /\b(self harm|suicide|kill myself|end it|hurt myself|i want to die)\b/.test(t),
    reply:
      "I’m really glad you reached out. I’m not a crisis service, but you deserve immediate care. If you’re in danger or considering self-harm, please contact local emergency services or a crisis line (e.g., 988 in the U.S.). If you’d like, we can do a grounding exercise together.",
    chips: ["Grounding Exercise", "Breathing 4-7-8", "Call a Friend"],
  },
];

function ruleReply(userText) {
  const t = norm(userText);
  for (const r of rules) if (r.match(t)) return { text: r.reply, chips: r.chips || [] };
  return {
    text:
      "Thanks for sharing. Would you like a quick breathing exercise, a 2-minute journal, or to set a tiny goal for today?",
    chips: ["Start Meditation", "Open Journal", "Set a Goal"],
  };
}

/* ---------------- UI constants ---------------- */
const BG = "#F6F7FB";
const BOT = "#EAF1FF";
const USER = "#EAFBF2";
const FOOTER_HEIGHT = 64;
const INPUT_MIN = 44;
const INPUT_MAX = 120;

/* small helper for date separators */
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

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [inputHeight, setInputHeight] = useState(INPUT_MIN);

  const scrollRef = useRef(null);

  const scrollToBottom = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKbOpen(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKbOpen(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("chatHistory");
      const raw = saved ? JSON.parse(saved) : [];
      const sanitized = Array.isArray(raw)
        ? raw.filter((m) => {
            if (m.role === "chips") return true;
            if (m.role === "user" || m.role === "bot")
              return typeof m.text === "string" && m.text.trim().length > 0;
            return false;
          })
        : [];
      setMessages(
        sanitized.length
          ? sanitized
          : [
              {
                id: String(Date.now()),
                role: "bot",
                text:
                  "Welcome to Healio Chat 🤖\nI’m a motivational, non-clinical companion. Tell me how you’re doing, and I’ll suggest gentle next steps.",
                ts: Date.now(),
              },
            ]
      );
      setShowHero(true);
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const addMsg = (role, content) => {
    const m = { id: String(Date.now() + Math.random()), role, text: content, ts: Date.now() };
    setMessages((prev) => [...prev, m]);
  };

  const addChips = (chips) =>
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), role: "chips", chips, ts: Date.now() },
    ]);

  const handleSend = async () => {
    const input = text.trim();
    if (!input) return;

    if (showHero) setShowHero(false);

    addMsg("user", input);
    setText("");
    setInputHeight(INPUT_MIN);
    setTyping(true);
    scrollToBottom();

    const historyForLLM = messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "bot") &&
          typeof m.text === "string" &&
          m.text.trim().length > 0
      )
      .slice(-10)
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

    const llmMessages = [
      {
        role: "system",
        content:
          "You are a kind, motivational, non-clinical mental wellness companion. Be empathetic, brief (2–3 sentences), and suggest one small action when helpful.",
      },
      ...historyForLLM,
      { role: "user", content: input },
    ];

    const llm = await chatWithLLM(llmMessages);
    const { text: reply, chips } = llm
      ? { text: llm, chips: ["Start Meditation", "Open Journal", "Set a Goal"] }
      : ruleReply(input);

    addMsg("bot", reply);
    if (chips?.length) addChips(chips);
    setTyping(false);
    scrollToBottom();
  };

  const onTapChip = (chip) => {
    const map = {
      "Start Meditation": () => navigation.navigate("Meditation", { activity: "Meditation" }),
      "Breathing 4-7-8": () => navigation.navigate("Meditation", { activity: "Meditation" }),
      "Grounding Exercise": () => navigation.navigate("Meditation", { activity: "Meditation" }),
      "Open Journal": () => navigation.navigate("Journal"),
      "Log Mood": () => navigation.navigate("ActivityDetail", { activity: "Journaling" }),
      "Set a Goal": () => navigation.navigate("GoalSetup"),
      "View Progress": () => navigation.navigate("Progress"),
      "Call a Friend": () => addMsg("bot", "Consider reaching someone you trust. You matter 💛"),
    };
    (map[chip] || (() => addMsg("bot", "On it!")))();
    scrollToBottom();
  };

  const bottomSpacer =
    (kbOpen ? 8 : FOOTER_HEIGHT + 8) + insets.bottom + Math.max(inputHeight, INPUT_MIN);

  /* group by day to insert separators */
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header (subtle card) */}
      <View style={styles.headerCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image
            source={require("../assets/robo4.jpg")}
            style={styles.avatar}
            resizeMode="cover"
          />
          <Text style={styles.headerTitle}>Healio AI Chatbot</Text>
        </View>
      </View>

      {/* Hero (first visit only) */}
      {showHero && (
        <View style={styles.hero}>
          <Text style={styles.heroText}>
            I’m here for calm, supportive conversation. If you’re in crisis, please contact local
            emergency services.
          </Text>
          {!kbOpen && (
            <Image
              source={require("../assets/robo4.jpg")}
              style={styles.illustration}
              resizeMode="contain"
            />
          )}
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 })}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: bottomSpacer }}
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

        {/* Input bar (pill) */}
        <View style={[styles.inputBar, { marginBottom: (kbOpen ? 8 : FOOTER_HEIGHT + 8) + insets.bottom }]}>
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
            activeOpacity={0.8}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Footer />
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

  hero: {
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAECEF",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  heroText: { color: "#475569", lineHeight: 18 },
  illustration: { width: "100%", height: 110, marginTop: 10, borderRadius: 12 },

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

  inputBar: {
    marginHorizontal: 12,
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
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#A5B4FC", marginRight: 4 },
});
