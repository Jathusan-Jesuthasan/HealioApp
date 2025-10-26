import React, { useState } from "react";
import { CommonActions } from "@react-navigation/native";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../config/api";

const { width, height } = Dimensions.get("window");

export default function SignupScreen({ navigation, route }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm: "",
    name: "",
    age: "",
    gender: "",
    role: "youth"
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [showGenderModal, setShowGenderModal] = useState(false);
  // Youth onboarding wizard state
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState({});
  const [onboardingQuestions, setOnboardingQuestions] = useState([]);
  
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const genderOptions = [
    { value: "male", label: "Male", icon: "user" },
    { value: "female", label: "Female", icon: "user-check" },
    { value: "non-binary", label: "Non-binary", icon: "users" },
    { value: "transgender", label: "Transgender", icon: "shuffle" },
    { value: "other", label: "Other", icon: "help-circle" },
    { value: "prefer-not-to-say", label: "Prefer not to say", icon: "eye-off" },
  ];

  const normalizeRole = (role) => (role === "trusted" ? "Trusted" : "Youth");

  const normalizeGender = (value) => {
    switch (value) {
      case "male":
        return "Male";
      case "female":
        return "Female";
      case "prefer-not-to-say":
        return "Prefer not to say";
      case "other":
        return "Other";
      case "non-binary":
      case "transgender":
        return "Other";
      default:
        return "";
    }
  };

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).toLowerCase());

  const getFieldError = (field, value) => {
    const trimmedValue = typeof value === "string" ? value.trim() : value;

    switch (field) {
      case "email":
        if (!trimmedValue) return "Email is required";
        if (!validateEmail(value)) return "Please enter a valid email address";
        return null;
      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;
      case "confirm":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords don't match";
        return null;
      case "name":
        if (!trimmedValue) return "Name is required";
        return null;
      case "age":
        if (!trimmedValue) return "Age is required";
        if (isNaN(value) || parseInt(value, 10) < 13 || parseInt(value, 10) > 25) {
          return "Please enter a valid age (13-25)";
        }
        return null;
      case "gender":
        if (!trimmedValue) return "Please select your gender";
        return null;
      default:
        return null;
    }
  };

  const validateField = (field, value) => {
    const errorMessage = getFieldError(field, value);
    setErrors((prev) => {
      const updated = { ...prev };
      if (errorMessage) {
        updated[field] = errorMessage;
      } else {
        delete updated[field];
      }
      return updated;
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleInputFocus = (field) => {
    setFocusedField(field);
  };

  const handleInputBlur = (field) => {
    setFocusedField(null);
    validateField(field, formData[field]);
  };

  const handleGenderSelect = (gender) => {
    handleInputChange('gender', gender.value);
    setShowGenderModal(false);
  };

  // Fetch onboarding questions when role becomes youth
  React.useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (formData.role) {
          const res = await api.get(`/api/auth/questions?role=${formData.role}`);
          setOnboardingQuestions(res.data.questions || []);
          setOnboardingStep(0);
          setOnboardingAnswers({});
        }
      } catch (err) {
        console.error('Failed to fetch questions', err.message || err);
      }
    };
    if (formData.role === 'youth') fetchQuestions();
  }, [formData.role]);

  // Merge onboardingAnswers returned from OnboardingWizard (via route.params)
  React.useEffect(() => {
    if (route?.params?.onboardingAnswers) {
      setOnboardingAnswers(prev => ({ ...prev, ...route.params.onboardingAnswers }));
    }
  }, [route?.params?.onboardingAnswers]);

  const getGenderLabel = () => {
    if (!formData.gender) return "Select your gender";
    const selected = genderOptions.find(opt => opt.value === formData.gender);
    return selected ? selected.label : "Select your gender";
  };

  const getGenderIcon = () => {
    if (!formData.gender) return "user";
    const selected = genderOptions.find(opt => opt.value === formData.gender);
    return selected ? selected.icon : "user";
  };

  const Touchable = Platform.OS === "web" ? Pressable : TouchableOpacity;

  const goToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  };

  const goToYouthQuestionnaire = (userData) => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "YouthQuestionnaire",
            params: {
              userData,
              token: userData?.token,
              fromSignup: true,
              showRolePrompt: true,
            },
          },
        ],
      })
    );
  };

  const handleSignup = async () => {
    const fieldsToValidate = ["email", "password", "confirm", "name", "age", "gender"];
    const validationErrors = {};

    fieldsToValidate.forEach((field) => {
      const errorMessage = getFieldError(field, formData[field]);
      if (errorMessage) {
        validationErrors[field] = errorMessage;
      }
    });

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return Alert.alert("Almost There! 🌟", "Please fix the highlighted fields before continuing.");
    }

    const canonicalRole = normalizeRole(formData.role);
    const canonicalGender = normalizeGender(formData.gender);

    if (!canonicalGender) {
      return Alert.alert("Almost There! 🌟", "Please select a gender option before continuing.");
    }

    const numericAge = Number(formData.age);
    if (Number.isNaN(numericAge)) {
      return Alert.alert("Almost There! 🌟", "Please provide a valid age.");
    }

    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/register", {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        age: numericAge,
        gender: canonicalGender,
        role: canonicalRole,
      });
      console.log("Registered:", data);

      const profilePayload = data?.profile || {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role ?? canonicalRole,
        age: data.age ?? numericAge,
        gender: data.gender ?? canonicalGender,
      };

      if (canonicalRole === "Youth") {
        goToYouthQuestionnaire({ token: data.token, profile: profilePayload });
        return;
      }

      Alert.alert(
        "Welcome to Healio! 🎉",
        "Your account has been created successfully. Please sign in to continue."
      );
      goToLogin();
    } catch (error) {
      console.error(error.response?.data || error.message);
      const msg = error.response?.data?.message ||
        "We encountered a temporary issue. Please try again in a moment.";
      Alert.alert("Registration Paused", msg);
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (field) => {
    const isFocused = focusedField === field;
    const hasError = errors[field];
    
    if (hasError) {
      return [styles.inputContainer, styles.inputContainerError];
    }
    if (isFocused) {
      return [styles.inputContainer, styles.inputContainerFocused];
    }
    return styles.inputContainer;
  };

  const getIconColor = (field) => {
    if (errors[field]) return '#EF4444';
    if (focusedField === field) return '#10B981';
    return '#666';
  };

  const requiredFields = ["email", "password", "confirm", "name", "age", "gender"];
  const isFormComplete = requiredFields.every((field) => {
    const value = formData[field];
    if (typeof value === "string") {
      return value.trim().length > 0;
    }
    return Boolean(value);
  });
  const hasBlockingErrors = Object.keys(errors).length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={require("../../assets/auth-bg2.jpg")}
        style={styles.background}
        blurRadius={2}
      >
        {/* Decorative Elements */}
        <View style={styles.floatingIcons}>
          <View style={[styles.floatingIcon, { top: '15%', left: '10%' }]}>
            <Ionicons name="heart" size={24} color="#4A90E2" />
          </View>
          <View style={[styles.floatingIcon, { top: '25%', right: '15%' }]}>
            <Ionicons name="leaf" size={24} color="#10B981" />
          </View>
          <View style={[styles.floatingIcon, { bottom: '30%', left: '20%' }]}>
            <Ionicons name="cloud" size={24} color="#4A90E2" />
          </View>
          <View style={[styles.floatingIcon, { bottom: '20%', right: '10%' }]}>
            <Ionicons name="star" size={24} color="#10B981" />
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Logo and Welcome Section */}
              <View style={styles.header}>
                <Image 
                  source={require("../../assets/healio_logo_login.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>Join Healio! </Text>
                <Text style={styles.subtitle}>
                  Start your mental wellness journey with secure, private access. We're excited to have you!
                </Text>
              </View>

              {/* Signup Form */}
              <View style={styles.formCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
                  style={styles.formGradient}
                >
                  {/* Email Input */}
                  <View>
                    <View style={getInputStyle('email')}>
                      <Feather name="mail" size={20} color={getIconColor('email')} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Your email address"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={formData.email}
                        onChangeText={(value) => handleInputChange('email', value)}
                        onFocus={() => handleInputFocus('email')}
                        onBlur={() => handleInputBlur('email')}
                        returnKeyType="next"
                      />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>

                  {/* Password Input */}
                  <View>
                    <View style={getInputStyle('password')}>
                      <Feather name="lock" size={20} color={getIconColor('password')} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Create your password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword}
                        value={formData.password}
                        onChangeText={(value) => handleInputChange('password', value)}
                        onFocus={() => handleInputFocus('password')}
                        onBlur={() => handleInputBlur('password')}
                        returnKeyType="next"
                      />
                      <Touchable 
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Feather 
                          name={showPassword ? "eye" : "eye-off"} 
                          size={20} 
                          color={getIconColor('password')} 
                        />
                      </Touchable>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                    {!errors.password && formData.password && (
                      <Text style={styles.helperText}>
                        {formData.password.length >= 6 ? '✓ Strong password' : 'At least 6 characters'}
                      </Text>
                    )}
                  </View>

                  {/* Confirm Password Input */}
                  <View>
                    <View style={getInputStyle('confirm')}>
                      <Feather name="lock" size={20} color={getIconColor('confirm')} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showConfirmPassword}
                        value={formData.confirm}
                        onChangeText={(value) => handleInputChange('confirm', value)}
                        onFocus={() => handleInputFocus('confirm')}
                        onBlur={() => handleInputBlur('confirm')}
                        returnKeyType="next"
                      />
                      <Touchable 
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        <Feather 
                          name={showConfirmPassword ? "eye" : "eye-off"} 
                          size={20} 
                          color={getIconColor('confirm')} 
                        />
                      </Touchable>
                    </View>
                    {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
                    {!errors.confirm && formData.confirm && formData.password === formData.confirm && (
                      <Text style={[styles.helperText, styles.successText]}>✓ Passwords match</Text>
                    )}
                  </View>

                  {/* Onboarding Questions */}
                  <View>
                    <View style={getInputStyle('name')}>
                      <Feather name="user" size={20} color={getIconColor('name')} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Your full name"
                        placeholderTextColor="#999"
                        value={formData.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                        onFocus={() => handleInputFocus('name')}
                        onBlur={() => handleInputBlur('name')}
                        returnKeyType="next"
                      />
                    </View>
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>

                  <View>
                    <View style={getInputStyle('age')}>
                      <Feather name="calendar" size={20} color={getIconColor('age')} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Your age"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={formData.age}
                        onChangeText={(value) => handleInputChange('age', value)}
                        onFocus={() => handleInputFocus('age')}
                        onBlur={() => handleInputBlur('age')}
                        returnKeyType="next"
                        maxLength={3}
                      />
                    </View>
                    {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
                  </View>

                  {/* Gender Selection */}
                  <View>
                    <Touchable 
                      style={getInputStyle('gender')}
                      onPress={() => setShowGenderModal(true)}
                    >
                      <Feather name={getGenderIcon()} size={20} color={getIconColor('gender')} style={styles.inputIcon} />
                      <Text style={[
                        styles.genderText,
                        !formData.gender && styles.genderPlaceholder
                      ]}>
                        {getGenderLabel()}
                      </Text>
                      <Feather 
                        name="chevron-down" 
                        size={20} 
                        color={getIconColor('gender')} 
                        style={styles.chevronIcon}
                      />
                    </Touchable>
                    {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
                  </View>

                  <Touchable
                    style={[
                      styles.signUpButton,
                      (hasBlockingErrors || !isFormComplete || loading) && styles.signUpButtonDisabled
                    ]}
                    onPress={handleSignup}
                    disabled={loading || hasBlockingErrors || !isFormComplete}
                  >
                    <LinearGradient
                      colors={['#10B981', '#4A90E2']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.signUpText}>Start Your Journey</Text>
                          <Feather name="arrow-right" size={20} color="#fff" style={styles.buttonIcon} />
                        </>
                      )}
                    </LinearGradient>
                  </Touchable>

                  {/* Login Link */}
                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already part of our community? </Text>
                    <Touchable onPress={goToLogin}>
                      <Text style={styles.loginLink}>Welcome back!</Text>
                    </Touchable>
                  </View>
                </LinearGradient>
              </View>

              {/* Mental Health Support Message */}
              <View style={styles.supportMessage}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <Text style={styles.supportText}>
                  Your privacy and mental health data are protected with enterprise-grade security.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Gender Selection Modal */}
        <Modal
          visible={showGenderModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowGenderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                <Touchable 
                  onPress={() => setShowGenderModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Feather name="x" size={24} color="#666" />
                </Touchable>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {genderOptions.map((option) => (
                  <Touchable
                    key={option.value}
                    style={[
                      styles.genderOption,
                      formData.gender === option.value && styles.genderOptionSelected
                    ]}
                    onPress={() => handleGenderSelect(option)}
                  >
                    <Feather 
                      name={option.icon} 
                      size={20} 
                      color={formData.gender === option.value ? '#10B981' : '#666'} 
                    />
                    <Text style={[
                      styles.genderOptionText,
                      formData.gender === option.value && styles.genderOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {formData.gender === option.value && (
                      <Feather name="check" size={20} color="#10B981" />
                    )}
                  </Touchable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
  },
  floatingIcons: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingBlockStart: 5,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
    marginTop: -80,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 2,
    marginTop: -80,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
  },
  formGradient: {
    padding: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainerFocused: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#2D3748',
  },
  genderText: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#2D3748',
  },
  genderPlaceholder: {
    color: '#999',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  helperText: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  successText: {
    color: '#10B981',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    gap: 8,
  },
  roleSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  roleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  roleTextSelected: {
    color: '#10B981',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  signUpText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loginText: {
    color: '#718096',
    fontSize: 15,
  },
  loginLink: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '700',
  },
  supportMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 16,
    marginTop: 10,
  },
  supportText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 400,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
  },
  genderOptionSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  genderOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  mcqOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  mcqOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.06)'
  },
  mcqOptionText: {
    color: '#2D3748',
    fontSize: 15,
  },
  mcqOptionTextSelected: {
    color: '#10B981',
    fontWeight: '700'
  },
});
