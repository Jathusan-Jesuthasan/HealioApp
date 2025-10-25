// frontend/screens/User_Profile/YouthQuestionnaireScreen.jsx

import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingContext } from "../../context/OnboardingContext";
import { AuthContext } from "../../context/AuthContext";
import api from "../../config/api";

export default function YouthQuestionnaireScreen({ navigation, route }) {
  const { markAsOnboarded, setAnswers, answers } = useContext(OnboardingContext);
  const { userToken, refreshUser } = useContext(AuthContext);
  const { userData } = route.params || {};
  const tokenFromParams = userData?.token;
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  // Allow prefill if navigating from Profile (editing existing questionnaire)
  const existing = route.params?.questionnaire || {};
  const readOnly = route.params?.readOnly || false;

  const [form, setForm] = useState({
    age: existing.age ? String(existing.age) : "",
    gender: existing.gender || "",
    stressLevel: existing.stressLevel || "",
    hasEmergencyContact: existing.hasEmergencyContact || false,
    emergencyContactName: existing.emergencyContactName || "",
    emergencyContactPhone: existing.emergencyContactPhone || "",
    allowMoodTracking: existing.allowMoodTracking !== undefined ? existing.allowMoodTracking : true,
    additionalNotes: existing.additionalNotes || "",
  });

  // Simplified questions for a faster, friendlier experience
  const questions = [
    {
      id: "age",
      question: "What's your age?",
      type: "input",
      placeholder: "Enter your age",
      validation: (value) => {
        const age = parseInt(value);
        return !isNaN(age) && age >= 13 && age <= 120;
      },
    },
    {
      id: "gender",
      question: "How do you identify?",
      type: "select",
      options: ["Male", "Female", "Other", "Prefer not to say"],
    },
    {
      id: "stressLevel",
      question: "How stressed are you right now?",
      type: "select",
      options: ["Low", "Moderate", "High"],
    },
    {
      id: "hasEmergencyContact",
      question: "Do you have an emergency contact?",
      type: "boolean",
    },
    {
      id: "emergencyContactName",
      question: "Emergency contact name",
      type: "input",
      placeholder: "Contact name",
      conditional: "hasEmergencyContact",
    },
    {
      id: "emergencyContactPhone",
      question: "Emergency contact phone",
      type: "input",
      placeholder: "Phone number",
      conditional: "hasEmergencyContact",
    },
    {
      id: "allowMoodTracking",
      question: "Allow mood tracking to improve experience?",
      type: "boolean",
    },
    {
      id: "additionalNotes",
      question: "Anything else you'd like to share? (optional)",
      type: "input",
      placeholder: "Optional notes",
      multiline: true,
    },
  ];

  const handleAnswer = (questionId, value) => {
    if (readOnly) return; // prevent edits in read-only mode
    setForm((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelect = (questionId, value) => {
    setForm((prev) => ({
      ...prev,
      [questionId]: prev[questionId].includes(value)
        ? prev[questionId].filter((item) => item !== value)
        : [...prev[questionId], value],
    }));
  };

  const nextStep = async () => {
    const currentQuestion = questions[currentStep];
    
    // Validate current answer
    if (currentQuestion.validation && !currentQuestion.validation(form[currentQuestion.id])) {
      Alert.alert("Invalid Input", "Please enter a valid age between 13 and 25.");
      return;
    }

    // Check if conditional question should be shown
    if (currentQuestion.conditional && !form[currentQuestion.conditional]) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await submitQuestionnaire();
    }
  };

  const submitQuestionnaire = async () => {
    try {
      if (readOnly) return navigation.goBack();
      setLoading(true);
      
      // Prepare questionnaire data (simplified)
      const questionnaireData = {
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender,
        stressLevel: form.stressLevel,
        hasEmergencyContact: form.hasEmergencyContact,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        allowMoodTracking: form.allowMoodTracking,
        additionalNotes: form.additionalNotes,
      };

      // Submit to backend. Use token from AuthContext if present; otherwise use token passed from signup.
      const tokenToUse = userToken || tokenFromParams;
      if (!tokenToUse) {
        throw new Error("No auth token available to submit questionnaire");
      }
      const response = await api.post("/api/questionnaire", questionnaireData, {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });

      if (response.data.success) {
        // Save to onboarding context
        const finalData = { ...answers, ...form, role: "Youth" };
        setAnswers(finalData);
        await markAsOnboarded(finalData);
        // If we have a persisted token (userToken) refresh user profile in AuthContext so merged info is visible immediately
        try {
          if (userToken && typeof refreshUser === "function") await refreshUser();
        } catch (e) {
          console.warn("Could not refresh user after questionnaire:", e.message || e);
        }

        // Navigate directly to RoleSelection and pass the questionnaire data
        return navigation.navigate("RoleSelection", { userData: { ...userData, questionnaire: finalData } });
      }
    } catch (error) {
      console.error("Questionnaire submission error:", error);
      Alert.alert(
        "Error", 
        "Failed to save questionnaire. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const renderQuestion = () => {
    // Skip conditional questions if condition not met
    if (currentQuestion.conditional && !form[currentQuestion.conditional]) {
      return null;
    }

    switch (currentQuestion.type) {
      case "input":
        return (
          <TextInput
            style={[styles.input, currentQuestion.multiline && styles.multilineInput]}
            placeholder={currentQuestion.placeholder}
            value={form[currentQuestion.id]}
            onChangeText={(text) => handleAnswer(currentQuestion.id, text)}
            multiline={currentQuestion.multiline}
            numberOfLines={currentQuestion.multiline ? 4 : 1}
            keyboardType={currentQuestion.id === "age" ? "numeric" : "default"}
          />
        );

      case "select":
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.optionButton,
                  form[currentQuestion.id] === option && styles.optionSelected,
                ]}
                onPress={() => handleAnswer(currentQuestion.id, option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    form[currentQuestion.id] === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "multiSelect":
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.optionButton,
                  form[currentQuestion.id].includes(option) && styles.optionSelected,
                ]}
                onPress={() => handleMultiSelect(currentQuestion.id, option)}
              >
                <Ionicons
                  name={
                    form[currentQuestion.id].includes(option)
                      ? "checkmark-circle"
                      : "ellipse-outline"
                  }
                  size={20} 
                  color={form[currentQuestion.id].includes(option) ? "#4A90E2" : "#9CA3AF"}
                />
                <Text
                  style={[
                    styles.optionText,
                    form[currentQuestion.id].includes(option) && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "boolean":
        return (
          <View style={styles.booleanContainer}>
            {["Yes", "No"].map((val, idx) => {
              const boolVal = val === "Yes";
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.booleanButton,
                    form[currentQuestion.id] === boolVal && styles.booleanSelected,
                  ]}
                  onPress={() => handleAnswer(currentQuestion.id, boolVal)}
                >
                  <Text
                    style={[
                      styles.booleanText,
                      form[currentQuestion.id] === boolVal && styles.booleanTextSelected,
                    ]}
                  >
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={["#4A90E2", "#10B981"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerSection}>
              <Image
                source={require("../../assets/healio_logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Let's Get to Know You</Text>
              <Text style={styles.subtitle}>Help us personalize your experience 🌱</Text>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} of {questions.length}
              </Text>
            </View>

            {/* Question Card */}
            <View style={styles.card}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
              {renderQuestion()}

              <View style={styles.buttonContainer}>
                {currentStep > 0 && (
                  <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                    <Ionicons name="arrow-back" size={20} color="#4A90E2" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    (!form[currentQuestion.id] ||
                      (Array.isArray(form[currentQuestion.id]) &&
                        form[currentQuestion.id].length === 0) ||
                      loading) &&
                      styles.nextButtonDisabled,
                  ]}
                  disabled={
                    !form[currentQuestion.id] ||
                    (Array.isArray(form[currentQuestion.id]) &&
                      form[currentQuestion.id].length === 0) ||
                    loading
                  }
                  onPress={nextStep}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>
                        {currentStep === questions.length - 1 ? "Complete" : "Next"}
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20 },
  headerSection: { alignItems: "center", marginBottom: 25 },
  logo: { width: 80, height: 80, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: "700", color: "#fff" },
  subtitle: { color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 5 },
  progressContainer: { marginBottom: 20 },
  progressBar: { height: 6, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3 },
  progressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 3 },
  progressText: { color: "#fff", textAlign: "center", marginTop: 8 },
  card: {
    backgroundColor: "#F5F7FA",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  questionText: { fontSize: 18, fontWeight: "600", color: "#374151", marginBottom: 16 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 12,
    fontSize: 16,
    color: "#374151",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  optionsContainer: { gap: 10 },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  optionSelected: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  optionText: { marginLeft: 10, fontSize: 16, color: "#374151" },
  optionTextSelected: { color: "#fff" },
  booleanContainer: { flexDirection: "row", gap: 10 },
  booleanButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 14,
    alignItems: "center",
  },
  booleanSelected: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  booleanText: { color: "#374151", fontSize: 16, fontWeight: "600" },
  booleanTextSelected: { color: "#fff" },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 25 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#4A90E2",
  },
  backButtonText: { color: "#4A90E2", fontWeight: "600", marginLeft: 6 },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    paddingVertical: 12,
    marginLeft: 10,
  },
  nextButtonDisabled: { backgroundColor: "#9CA3AF" },
  nextButtonText: { color: "#fff", fontWeight: "700", fontSize: 16, marginRight: 6 },
});
