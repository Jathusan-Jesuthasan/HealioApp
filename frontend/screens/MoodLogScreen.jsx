import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  ScrollView, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { Colors } from "../utils/Colors";

const MoodLogScreen = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [journalText, setJournalText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false); // Default to false
  
  const moods = [
    { emoji: "😊", label: "Happy", color: "#F59E0B" },
    { emoji: "😐", label: "Neutral", color: "#4A90E2" },
    { emoji: "😔", label: "Sad", color: "#64748B" },
    { emoji: "😡", label: "Angry", color: "#EF4444" },
    { emoji: "😴", label: "Tired", color: "#10B981" },
  ];

  const factors = [
    "Work", "Exercise", "Family", "Hobbies", "Finances",
    "Sleep", "Drink", "Food", "Relationships", "Education",
    "Weather", "Music", "Travel", "Health"
  ];

  // Initialize voice recognition
  useEffect(() => {
    // Check if we're in a development environment (Expo Go)
    // Voice recognition typically doesn't work in Expo Go
    // We'll simulate it for demonstration purposes
    checkVoiceAvailability();
  }, []);

  const checkVoiceAvailability = async () => {
    try {
      // In a real app with a development build, you would check for voice support
      // For Expo Go, we'll assume it's not supported
      setSpeechSupported(false);
      
      // If you're using a development build, you could check properly:
      // const available = await Voice.isAvailable();
      // setSpeechSupported(available);
    } catch (error) {
      console.error("Voice recognition not supported in Expo Go");
      setSpeechSupported(false);
    }
  };

  const simulateSpeechRecognition = () => {
    setIsRecording(true);
    
    // Simulate different responses based on selected mood
    const responses = {
      Happy: "Today was a great day! I woke up feeling energized and had a productive work session. I went for a walk in the park and enjoyed the sunny weather. I'm feeling grateful for my friends and family.",
      Neutral: "It was a fairly standard day. Work was busy but manageable. I didn't have any strong emotions today, just going through the motions. Looking forward to relaxing this evening.",
      Sad: "I've been feeling down today. I didn't sleep well last night and have been struggling with negative thoughts. I miss seeing my friends and feel a bit lonely.",
      Angry: "I'm so frustrated with my project at work. My colleagues weren't cooperating and everything that could go wrong did go wrong. I need to find a better way to manage this stress.",
      Tired: "I'm exhausted today. Didn't get enough sleep and have been dragging myself through the day. I need to prioritize rest and maybe take a break from my busy schedule."
    };
    
    const defaultResponse = "Today was interesting. I had some ups and downs but overall I'm managing. I need to focus on self-care and making time for things that bring me joy.";
    
    const response = selectedMood ? responses[selectedMood.label] || defaultResponse : defaultResponse;
    
    // Simulate recording for 3 seconds
    setTimeout(() => {
      setIsRecording(false);
      setJournalText(prevText => prevText ? `${prevText} ${response}` : response);
      Alert.alert("Voice Input", "Your speech has been converted to text. In a production app with a development build, this would use real speech recognition.");
    }, 3000);
  };

  const startSpeechToText = async () => {
    if (!speechSupported) {
      // Simulate voice recognition for demo purposes
      simulateSpeechRecognition();
      return;
    }

    try {
      // This would be the real implementation with a development build
      // await Voice.start('en-US');
    } catch (error) {
      console.error("Voice recognition error:", error);
      Alert.alert("Error", "Could not start voice recording");
    }
  };

  const stopSpeechToText = async () => {
    try {
      // This would be the real implementation with a development build
      // await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error("Error stopping voice recognition:", error);
    }
  };

  // Simple keyword-based sentiment analysis
  const analyzeSentiment = (text) => {
    if (!text || text.length < 10) return null;
    
    const positiveWords = ['happy', 'good', 'great', 'excited', 'love', 'joy', 'wonderful', 'amazing', 'fantastic'];
    const negativeWords = ['sad', 'bad', 'terrible', 'hate', 'angry', 'awful', 'horrible', 'depressed', 'anxious'];
    const tiredWords = ['tired', 'exhausted', 'sleepy', 'fatigue', 'drained', 'burned out'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let tiredCount = 0;
    
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
      if (tiredWords.includes(word)) tiredCount++;
    });
    
    if (positiveCount > negativeCount && positiveCount > tiredCount) return 'positive';
    if (negativeCount > positiveCount && negativeCount > tiredCount) return 'negative';
    if (tiredCount > positiveCount && tiredCount > negativeCount) return 'tired';
    return 'neutral';
  };

  // Suggest mood based on journal text
  const suggestMoodFromText = async () => {
    if (!journalText || journalText.length < 10) return;
    
    setIsProcessing(true);
    
    try {
      // Add a small delay to show the loading indicator
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sentiment = analyzeSentiment(journalText);
      
      switch(sentiment) {
        case 'positive':
          setSelectedMood(moods[0]); // Happy
          break;
        case 'negative':
          setSelectedMood(moods[2]); // Sad
          break;
        case 'tired':
          setSelectedMood(moods[4]); // Tired
          break;
        default:
          setSelectedMood(moods[1]); // Neutral
      }
    } catch (error) {
      console.error("Error in mood suggestion:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFactor = (factor) => {
    if (selectedFactors.includes(factor)) {
      setSelectedFactors(selectedFactors.filter(f => f !== factor));
    } else {
      setSelectedFactors([...selectedFactors, factor]);
    }
  };

  const handleSubmit = () => {
    if (selectedMood) {
      console.log("Selected mood:", selectedMood);
      console.log("Selected factors:", selectedFactors);
      console.log("Journal text:", journalText);
      navigation.navigate("Dashboard");
    }
  };

  const clearJournalText = () => {
    setJournalText("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🩺</Text>
              <Text style={styles.logoText}>Healio</Text>
            </View>
            <Text style={styles.headerSubtitle}>Mood Journal</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.title}>How are you feeling today?</Text>
              
              <View style={styles.moodContainer}>
                {moods.map((mood, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.moodButton,
                      selectedMood?.emoji === mood.emoji && { 
                        backgroundColor: `${mood.color}20`,
                        borderColor: mood.color,
                        transform: [{ scale: 1.1 }]
                      },
                    ]}
                    onPress={() => setSelectedMood(mood)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What's affecting your mood?</Text>
                <View style={styles.factorsContainer}>
                  {factors.map((factor, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.factorButton,
                        selectedFactors.includes(factor) && styles.factorButtonSelected
                      ]}
                      onPress={() => toggleFactor(factor)}
                    >
                      <Text style={[
                        styles.factorText,
                        selectedFactors.includes(factor) && styles.factorTextSelected
                      ]}>
                        {factor}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.journalHeader}>
                  <Text style={styles.sectionTitle}>Let's write about it</Text>
                  <TouchableOpacity onPress={clearJournalText} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionSubtitle}>
                  How is your day going? How has it affected your mood? Or anything else...
                </Text>
                
                <View style={styles.journalContainer}>
                  <TextInput
                    style={styles.journalInput}
                    multiline
                    numberOfLines={6}
                    placeholder="Write about your day, your feelings, or anything that's on your mind..."
                    value={journalText}
                    onChangeText={setJournalText}
                    textAlignVertical="top"
                  />
                  
                  <View style={styles.voiceActions}>
                    <TouchableOpacity 
                      style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                      onPress={isRecording ? stopSpeechToText : startSpeechToText}
                    >
                      <Text style={styles.voiceButtonIcon}>
                        {isRecording ? "⏹️" : "🎤"}
                      </Text>
                      <Text style={styles.voiceButtonText}>
                        {isRecording ? "Stop Recording" : "Tap to Speak"}
                      </Text>
                    </TouchableOpacity>
                    
                    {journalText.length > 10 && (
                      <TouchableOpacity 
                        style={styles.analyzeButton}
                        onPress={suggestMoodFromText}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text style={styles.analyzeButtonText}>Suggest Mood</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <Text style={styles.unsupportedText}>
                  Voice input simulation (real voice recognition requires development build)
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, !selectedMood && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!selectedMood}
              >
                <Text style={styles.submitButtonText}>
                  {selectedMood ? "Log Mood & Continue" : "Select a Mood"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Tracking mood helps understand patterns</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.secondary,
  },
  headerSubtitle: {
    textAlign: "center",
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    color: Colors.textPrimary,
  },
  moodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 32,
  },
  moodButton: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clearButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  clearButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  factorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  factorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  factorButtonSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  factorText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  factorTextSelected: {
    color: "white",
    fontWeight: "500",
  },
  journalContainer: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: Colors.primary,
    marginBottom: 8,
  },
  journalInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    color: Colors.textPrimary,
  },
  voiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: Colors.primary,
    flex: 1,
  },
  voiceButtonActive: {
    backgroundColor: `${Colors.accent}20`,
  },
  voiceButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  voiceButtonText: {
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  analyzeButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  analyzeButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  unsupportedText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: Colors.accent,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowColor: "#94A3B8",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 24,
    padding: 16,
  },
  footerText: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: "italic",
  },
});

export default MoodLogScreen;