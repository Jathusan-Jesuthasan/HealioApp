// frontend/screens/User_Profile/YouthQuestionnaireScreen.jsx

import React, { useContext, useMemo, useState, useEffect, useCallback } from "react";
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

import { AuthContext } from "../../context/AuthContext";
import { OnboardingContext } from "../../context/OnboardingContext";
import api from "../../config/api";

const GENDER_CHOICES = [
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Prefer not to say", label: "Prefer not to say" },
  { value: "Other", label: "Prefer to self-describe" },
];

const STRESS_OPTIONS = [
  { value: "Relaxed", label: "Calm & relaxed" },
  { value: "Mostly okay", label: "Mostly okay" },
  { value: "Stressed", label: "Feeling stressed" },
  { value: "Overwhelmed", label: "Overwhelmed" },
];

const SLEEP_OPTIONS = [
  { value: "Rested", label: "Rested" },
  { value: "Light sleep", label: "Light sleep" },
  { value: "Restless", label: "Restless" },
  { value: "Exhausted", label: "Exhausted" },
];

const SUPPORT_OPTIONS = [
  { value: "Supported", label: "Very supported" },
  { value: "Somewhat supported", label: "Somewhat supported" },
  { value: "Neutral", label: "Neutral" },
  { value: "Isolated", label: "Isolated" },
];

const PRESSURE_OPTIONS = [
  { value: "Low", label: "Low or manageable" },
  { value: "Moderate", label: "A bit of pressure" },
  { value: "High", label: "High pressure" },
  { value: "Overwhelming", label: "Overwhelming" },
];

const SUPPORT_TYPE_OPTIONS = [
  { value: "Breathing exercises", label: "Breathing exercises" },
  { value: "Grounding techniques", label: "Grounding techniques" },
  { value: "Mood journaling", label: "Mood journaling" },
  { value: "Talk to a mentor", label: "Chat with a mentor" },
  { value: "Guided meditation", label: "Guided meditations" },
  { value: "Peer stories", label: "Stories from peers" },
];

const ROLE_OPTIONS = [
  {
    value: "Youth",
    title: "Youth User",
    blurb: "Personal mood tracking, calming activities, and a supportive community designed for you.",
  },
  {
    value: "Trusted",
    title: "Trusted Person",
    blurb: "Real-time insights, alerts, and tools to support someone you care about.",
  },
];

const phoneLooksValid = (value) => {
  if (!value) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6;
};

export default function YouthQuestionnaireScreen({ navigation, route }) {
  const {
    userToken,
    refreshUser,
    setAuthFromBackend,
    setUserRole,
    user: authUser,
  } = useContext(AuthContext);
  const { markAsOnboarded, setAnswers, answers } = useContext(OnboardingContext);

  const params = route?.params || {};
  const {
    answers: providedAnswers,
    questionnaire: questionnaireFromParams,
    readOnly = false,
    token: tokenFromParams = null,
    userData: signupUserData = null,
    showRolePrompt: showRolePromptParam,
  } = params;

  const fromSignupParam = params?.fromSignup;
  const fromSignup =
    typeof fromSignupParam === "boolean" ? fromSignupParam : Boolean(signupUserData);

  const aggregatedAnswers = useMemo(() => {
    const payload = {};
    if (answers) Object.assign(payload, answers);
    if (authUser?.questionnaire) Object.assign(payload, authUser.questionnaire);
    if (typeof authUser?.age !== "undefined" && authUser?.age !== null) {
      payload.age ??= authUser.age;
    }
    if (authUser?.gender) payload.gender ??= authUser.gender;
    if (signupUserData?.questionnaire) Object.assign(payload, signupUserData.questionnaire);
    if (questionnaireFromParams) Object.assign(payload, questionnaireFromParams);
    if (providedAnswers) Object.assign(payload, providedAnswers);
    return payload;
  }, [answers, authUser, signupUserData, questionnaireFromParams, providedAnswers]);

  const defaultAge = aggregatedAnswers?.age ?? null;
  const defaultGender = aggregatedAnswers?.gender ?? null;

  const derivedRole = useMemo(() => {
    const candidates = [
      aggregatedAnswers?.role,
      aggregatedAnswers?.loginRole,
      signupUserData?.role,
      authUser?.role,
      authUser?.userRole,
    ];
    const resolved = candidates.find((value) => typeof value === "string");
    return resolved && resolved.toLowerCase() === "trusted" ? "Trusted" : "Youth";
  }, [aggregatedAnswers, signupUserData, authUser]);

  const showRolePrompt = !readOnly && (showRolePromptParam ?? fromSignup);

  const initialForm = useMemo(
    () => ({
      age: aggregatedAnswers?.age ? String(aggregatedAnswers.age) : "",
      gender: aggregatedAnswers?.gender || "",
      stressLevel: aggregatedAnswers?.stressLevel || "",
      sleepQuality: aggregatedAnswers?.sleepQuality || "",
      socialSupport: aggregatedAnswers?.socialSupport || "",
      academicPressure: aggregatedAnswers?.academicPressure || "",
      preferredSupportType: Array.isArray(aggregatedAnswers?.preferredSupportType)
        ? aggregatedAnswers.preferredSupportType
        : [],
      hasEmergencyContact:
        typeof aggregatedAnswers?.hasEmergencyContact === "boolean"
          ? aggregatedAnswers.hasEmergencyContact
          : null,
      emergencyContactName: aggregatedAnswers?.emergencyContactName || "",
      emergencyContactPhone: aggregatedAnswers?.emergencyContactPhone || "",
      allowMoodTracking:
        typeof aggregatedAnswers?.allowMoodTracking === "boolean"
          ? aggregatedAnswers.allowMoodTracking
          : true,
      additionalNotes: aggregatedAnswers?.additionalNotes || "",
      loginRole: derivedRole,
    }),
    [aggregatedAnswers, derivedRole]
  );

  const [form, setForm] = useState(initialForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const questions = useMemo(() => {
    const base = [
      {
        id: "age",
        question: "How old are you?",
        type: "input",
        placeholder: "Enter your age (13 - 25)",
        keyboardType: "numeric",
        validation: (value) => {
          const num = Number(value);
          return Number.isInteger(num) && num >= 13 && num <= 25;
        },
        validationMessage: "Please enter an age between 13 and 25.",
      },
      {
        id: "gender",
        question: "How do you identify?",
        type: "select",
        options: GENDER_CHOICES,
      },
      {
        id: "stressLevel",
        question: "How stressed are you feeling today?",
        type: "select",
        options: STRESS_OPTIONS,
      },
      {
        id: "sleepQuality",
        question: "How would you rate your recent sleep quality?",
        type: "select",
        options: SLEEP_OPTIONS,
      },
      {
        id: "socialSupport",
        question: "How supported do you feel by friends or family?",
        type: "select",
        options: SUPPORT_OPTIONS,
      },
      {
        id: "academicPressure",
        question: "How intense is your current workload or study pressure?",
        type: "select",
        options: PRESSURE_OPTIONS,
      },
      {
        id: "preferredSupportType",
        question: "Which support options feel most helpful to you?",
        type: "multiSelect",
        options: SUPPORT_TYPE_OPTIONS,
      },
      {
        id: "hasEmergencyContact",
        question: "Do you have an emergency contact you trust?",
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
        keyboardType: "phone-pad",
        conditional: "hasEmergencyContact",
        validation: (value) => !value || phoneLooksValid(value),
        validationMessage: "Please enter a phone number we can reach.",
      },
      {
        id: "allowMoodTracking",
        question: "Would you like Healio to track your mood automatically?",
        type: "boolean",
      },
      {
        id: "additionalNotes",
        question: "Anything else you'd like to share? (optional)",
        type: "input",
        placeholder: "Optional notes",
        multiline: true,
        required: false,
      },
    ];

    if (showRolePrompt) {
      base.push({
        id: "loginRole",
        question: "How would you like to experience Healio right now?",
        type: "roleSelect",
        options: ROLE_OPTIONS,
      });
    }

    return base;
  }, [showRolePrompt]);

  const handleAnswer = (questionId, value) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelect = (questionId, value) => {
    if (readOnly) return;
    setForm((prev) => {
      const existingValues = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const updatedValues = existingValues.includes(value)
        ? existingValues.filter((item) => item !== value)
        : [...existingValues, value];
      return { ...prev, [questionId]: updatedValues };
    });
  };

  const shouldSkipQuestion = useCallback(
    (question) => {
      if (!question?.conditional) return false;
      const dependencyValue = form[question.conditional];
      return dependencyValue === false || dependencyValue === null || dependencyValue === undefined;
    },
    [form]
  );

  const isAnswered = useCallback(
    (question) => {
      if (!question) return false;
      if (question.required === false) return true;
      if (shouldSkipQuestion(question)) return true;

      const value = form[question.id];
      switch (question.type) {
        case "multiSelect":
          return Array.isArray(value) && value.length > 0;
        case "boolean":
          return value === true || value === false;
        case "roleSelect":
          return Boolean(value);
        case "input":
          return Boolean(String(value ?? "").trim());
        default:
          return Boolean(value);
      }
    },
    [form, shouldSkipQuestion]
  );

  useEffect(() => {
    const question = questions[currentStep];
    if (question && shouldSkipQuestion(question)) {
      setCurrentStep((prev) => {
        const nextIndex = Math.min(prev + 1, questions.length - 1);
        return nextIndex === prev ? prev : nextIndex;
      });
    }
  }, [questions, currentStep, shouldSkipQuestion]);

  const lastQuestionIndex = showRolePrompt
    ? Math.max(questions.length - 2, 0)
    : Math.max(questions.length - 1, 0);

  const submitQuestionnaire = async () => {
    if (readOnly) {
      navigation.goBack();
      return null;
    }

    const tokenToUse =
      userToken ||
      tokenFromParams ||
      signupUserData?.token ||
      authUser?.token ||
      null;
    if (!tokenToUse) {
      Alert.alert("Sign in required", "Please log in again to save your questionnaire.");
      return null;
    }

    try {
      setLoading(true);

      const ageSource = form.age || (defaultAge ? String(defaultAge) : "");
      const parsedAge = Number(ageSource);
      if (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 25) {
        Alert.alert("Invalid age", "Please enter an age between 13 and 25.");
        return null;
      }

      const genderValue = form.gender || defaultGender;
      if (!genderValue) {
        Alert.alert("Missing detail", "Please select the gender you are most comfortable sharing.");
        return null;
      }

      const hasContact = form.hasEmergencyContact === true;

      if (hasContact && form.emergencyContactPhone && !phoneLooksValid(form.emergencyContactPhone)) {
        Alert.alert("Phone number", "Please enter a phone number we can reach.");
        return null;
      }

      const questionnaireData = {
        age: parsedAge,
        gender: genderValue,
        stressLevel: form.stressLevel,
        sleepQuality: form.sleepQuality,
        socialSupport: form.socialSupport,
        academicPressure: form.academicPressure,
        preferredSupportType: Array.isArray(form.preferredSupportType)
          ? form.preferredSupportType
          : [],
        hasEmergencyContact: hasContact,
        emergencyContactName: hasContact ? form.emergencyContactName : "",
        emergencyContactPhone: hasContact ? form.emergencyContactPhone : "",
        allowMoodTracking: form.allowMoodTracking === false ? false : true,
        additionalNotes: form.additionalNotes,
      };

      const { data } = await api.post("/api/questionnaire", questionnaireData, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });

      if (data?.success) {
        const normalizedRoleSelection = form.loginRole || derivedRole || "Youth";
        const finalData = {
          ...answers,
          ...questionnaireData,
          role: normalizedRoleSelection,
          loginRole: normalizedRoleSelection,
        };
        try {
          if (typeof setAnswers === "function") setAnswers(finalData);
          if (typeof markAsOnboarded === "function") await markAsOnboarded(finalData);
        } catch (ctxErr) {
          console.warn("Onboarding context update failed:", ctxErr.message || ctxErr);
        }

        try {
          if (typeof refreshUser === "function") await refreshUser();
        } catch (refreshErr) {
          console.warn("Could not refresh user after questionnaire:", refreshErr.message || refreshErr);
        }

        setSubmissionResult(data.data);
        return data.data;
      }

      return null;
    } catch (error) {
      console.error("Questionnaire submission error:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to save questionnaire. Please try again."
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!showRolePrompt) return;

    if (!form.loginRole) {
      Alert.alert("Select an option", "Please choose how you'd like to continue using Healio.");
      return;
    }

    const tokenToUse =
      userToken ||
      tokenFromParams ||
      signupUserData?.token ||
      authUser?.token ||
      null;
    if (!tokenToUse) {
      Alert.alert("Sign in required", "We couldn't locate your session. Please sign in again.");
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      return;
    }

    if (!submissionResult) {
      const saved = await submitQuestionnaire();
      if (!saved) return;
    }

    const normalizedRole = form.loginRole === "Trusted" ? "Trusted" : "Youth";

    try {
      const profileSource = signupUserData?.profile || signupUserData || authUser || {};
      const resolvedId =
        profileSource._id ||
        profileSource.id ||
        profileSource.userId ||
        submissionResult?.user;
      const authPayload = {
        ...profileSource,
        _id: resolvedId,
        token: tokenToUse,
        role: normalizedRole,
      };

      if (typeof setAuthFromBackend === "function") {
        await setAuthFromBackend(authPayload);
      }

      if (typeof setUserRole === "function") {
        setUserRole(normalizedRole);
      }

      if (profileSource?.role !== normalizedRole) {
        try {
          await api.put(
            "/api/users/me",
            { role: normalizedRole },
            { headers: { Authorization: `Bearer ${tokenToUse}` } }
          );
        } catch (roleErr) {
          console.warn("Could not update role after questionnaire:", roleErr.message || roleErr);
        }
      }

      try {
        if (typeof refreshUser === "function") await refreshUser();
      } catch (refreshErr) {
        console.warn("Failed to refresh user after onboarding:", refreshErr.message || refreshErr);
      }

      if (fromSignup) {
        navigation.reset({ index: 0, routes: [{ name: "AppTabs" }] });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      console.error("Complete onboarding error:", err);
      Alert.alert(
        "Almost there",
        "We saved your answers, but we couldn't finish sign-in automatically. Please log in again."
      );
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  };

  const nextStep = async () => {
    const currentQuestion = questions[currentStep];
    if (!currentQuestion) return;

    if (shouldSkipQuestion(currentQuestion)) {
      setCurrentStep((prev) => Math.min(prev + 1, questions.length - 1));
      return;
    }

    if (currentQuestion.validation && !currentQuestion.validation(form[currentQuestion.id])) {
      Alert.alert(
        "Check your answer",
        currentQuestion.validationMessage || "Please review your response before continuing."
      );
      return;
    }

    if (currentQuestion.type === "roleSelect") {
      await completeOnboarding();
      return;
    }

    if (currentStep === lastQuestionIndex) {
      const saved = await submitQuestionnaire();
      if (!saved) return;

      if (showRolePrompt) {
        setCurrentStep((prev) => prev + 1);
      } else {
        Alert.alert("Saved", "Your wellness profile has been updated.", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const currentQuestion = questions[currentStep];
  const progress = questions.length ? ((currentStep + 1) / questions.length) * 100 : 0;
  const nextButtonLabel = currentQuestion?.type === "roleSelect"
    ? "Enter Healio"
    : currentStep === lastQuestionIndex
    ? (showRolePrompt ? "Continue" : "Save")
    : "Next";
  const nextDisabled = loading || !isAnswered(currentQuestion);

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    if (currentQuestion.conditional && !form[currentQuestion.conditional]) {
      return null;
    }

    const resolveOption = (option) =>
      typeof option === "string" ? { value: option, label: option } : option;

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
            keyboardType={currentQuestion.keyboardType || "default"}
            editable={!readOnly}
          />
        );
      case "select":
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const { value, label } = resolveOption(option);
              const isSelected = form[currentQuestion.id] === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionButton, isSelected && styles.optionSelected]}
                  onPress={() => handleAnswer(currentQuestion.id, value)}
                  disabled={readOnly}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case "multiSelect":
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const { value, label } = resolveOption(option);
              const selectedValues = Array.isArray(form[currentQuestion.id])
                ? form[currentQuestion.id]
                : [];
              const isSelected = selectedValues.includes(value);
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionButton, isSelected && styles.optionSelected]}
                  onPress={() => handleMultiSelect(currentQuestion.id, value)}
                  disabled={readOnly}
                >
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={isSelected ? "#fff" : "#4A90E2"}
                    style={styles.optionIcon}
                  />
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case "boolean":
        return (
          <View style={styles.booleanContainer}>
            {["Yes", "No"].map((val) => {
              const boolVal = val === "Yes";
              const isSelected = form[currentQuestion.id] === boolVal;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.booleanButton, isSelected && styles.booleanSelected]}
                  onPress={() => handleAnswer(currentQuestion.id, boolVal)}
                  disabled={readOnly}
                >
                  <Text style={[styles.booleanText, isSelected && styles.booleanTextSelected]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case "roleSelect":
        return (
          <View style={styles.roleSelectContainer}>
            {currentQuestion.options.map((option) => {
              const isSelected = form.loginRole === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                  activeOpacity={0.85}
                  onPress={() => handleAnswer("loginRole", option.value)}
                >
                  <Ionicons
                    name={option.value === "Youth" ? "happy-outline" : "shield-checkmark-outline"}
                    size={28}
                    color={isSelected ? "#fff" : "#4A90E2"}
                    style={styles.roleIcon}
                  />
                  <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.roleBlurb, isSelected && styles.roleBlurbSelected]}>
                    {option.blurb}
                  </Text>
                  {isSelected && (
                    <View style={styles.roleBadge}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </View>
                  )}
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
            <View style={styles.headerSection}>
              <Image
                source={require("../../assets/healio_logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Let's Get to Know You</Text>
              <Text style={styles.subtitle}>Help us personalize your experience 🌱</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} of {questions.length}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.questionText}>{currentQuestion?.question}</Text>
              {renderQuestion()}

              <View style={styles.buttonContainer}>
                {currentStep > 0 && (
                  <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                    <Ionicons name="arrow-back" size={20} color="#4A90E2" />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.nextButton, nextDisabled && styles.nextButtonDisabled]}
                  disabled={nextDisabled}
                  onPress={nextStep}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>{nextButtonLabel}</Text>
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
  optionsContainer: { gap: 12 },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  optionSelected: { backgroundColor: "#4A90E2", borderColor: "#4A90E2" },
  optionText: { marginLeft: 10, fontSize: 16, color: "#374151" },
  optionTextSelected: { color: "#fff" },
  optionIcon: { marginRight: 8 },
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
  roleSelectContainer: { gap: 12 },
  roleOption: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
    padding: 18,
    position: "relative",
  },
  roleOptionSelected: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  roleIcon: { marginBottom: 12 },
  roleTitle: { fontSize: 18, fontWeight: "700", color: "#1E3A8A", marginBottom: 6 },
  roleTitleSelected: { color: "#fff" },
  roleBlurb: { color: "#1E3A8A", opacity: 0.8, lineHeight: 20 },
  roleBlurbSelected: { color: "rgba(255,255,255,0.85)" },
  roleBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 14,
    padding: 6,
  },
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
