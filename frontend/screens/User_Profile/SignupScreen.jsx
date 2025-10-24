import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
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
  
  const { signIn } = useContext(AuthContext);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const genderOptions = [
    { value: "male", label: "Male", icon: "male" },
    { value: "female", label: "Female", icon: "female" },
    { value: "non-binary", label: "Non-binary", icon: "user" },
    { value: "transgender", label: "Transgender", icon: "user" },
    { value: "other", label: "Other", icon: "help-circle" },
    { value: "prefer-not-to-say", label: "Prefer not to say", icon: "eye-off" },
  ];

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

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        if (!value.trim()) {
          newErrors.email = "Email is required";
        } else if (!validateEmail(value)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = "Password is required";
        } else if (value.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirm':
        if (!value) {
          newErrors.confirm = "Please confirm your password";
        } else if (value !== formData.password) {
          newErrors.confirm = "Passwords don't match";
        } else {
          delete newErrors.confirm;
        }
        break;
      case 'name':
        if (!value.trim()) {
          newErrors.name = "Name is required";
        } else {
          delete newErrors.name;
        }
        break;
      case 'age':
        if (!value.trim()) {
          newErrors.age = "Age is required";
        } else if (isNaN(value) || parseInt(value) < 13 || parseInt(value) > 120) {
          newErrors.age = "Please enter a valid age (13-120)";
        } else {
          delete newErrors.age;
        }
        break;
      case 'gender':
        if (!value.trim()) {
          newErrors.gender = "Please select your gender";
        } else {
          delete newErrors.gender;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
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

  const goToLogin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  };

  const handleSignup = async () => {
    // Validate all fields before submission
    Object.keys(formData).forEach(field => {
      validateField(field, formData[field]);
    });

    // If user is youth, ensure onboarding answers collected
    if (formData.role === 'youth') {
      const required = [0,1,2,3,4];
      for (let i of required) {
        if (!onboardingAnswers[`q${i}`]) {
          return Alert.alert('One more step', 'Please complete the youth onboarding questions before continuing.');
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return Alert.alert("Almost There! 🌟", "Please fix the errors before continuing.");
    }

    if (!formData.email || !formData.password || !formData.confirm || 
        !formData.name || !formData.age || !formData.gender || !formData.role) {
      return Alert.alert("Almost There! 🌟", "Please fill in all fields to start your wellness journey.");
    }

    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/register", {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        role: formData.role,
        answers: [
          { question: "age", answer: formData.age },
          { question: "gender", answer: formData.gender },
          { question: "role", answer: formData.role },
          // append onboarding answers for youth
          ...(formData.role === 'youth'
            ? Object.keys(onboardingAnswers).map(k => ({ question: k, answer: onboardingAnswers[k] }))
            : []),
        ],
      });
      console.log("Registered:", data);
      // If youth, continue to onboarding questions screen
      if (formData.role === 'youth') {
        // navigate to onboarding wizard and pass token & profile
        navigation.navigate('OnboardingWizard', { token: data.token, profile: data.profile, role: 'youth', returnTo: 'Signup' });
        return;
      }

      // For non-youth roles, sign in and go to app
      await signIn(data.token, data.profile);
      Alert.alert(
        "Welcome to Healio! 🎉",
        "Your account has been created successfully. Your mental wellness journey starts now!"
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
                      <TouchableOpacity 
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Feather 
                          name={showPassword ? "eye" : "eye-off"} 
                          size={20} 
                          color={getIconColor('password')} 
                        />
                      </TouchableOpacity>
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
                      <TouchableOpacity 
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        <Feather 
                          name={showConfirmPassword ? "eye" : "eye-off"} 
                          size={20} 
                          color={getIconColor('confirm')} 
                        />
                      </TouchableOpacity>
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
                    <TouchableOpacity 
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
                    </TouchableOpacity>
                    {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
                  </View>

                  {/* Role Selection */}
                  <View style={styles.roleContainer}>
                    <Text style={styles.roleLabel}>I am a:</Text>
                    <View style={styles.roleButtons}>
                      <TouchableOpacity 
                        onPress={() => handleInputChange('role', "youth")} 
                        style={[
                          styles.roleBtn, 
                          formData.role === "youth" && styles.roleSelected
                        ]}
                      >
                        <Ionicons 
                          name="person" 
                          size={20} 
                          color={formData.role === "youth" ? '#10B981' : '#666'} 
                        />
                        <Text style={[
                          styles.roleText, 
                          formData.role === "youth" && styles.roleTextSelected
                        ]}>
                          Youth
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleInputChange('role', "trusted")} 
                        style={[
                          styles.roleBtn, 
                          formData.role === "trusted" && styles.roleSelected
                        ]}
                      >
                        <Ionicons 
                          name="people" 
                          size={20} 
                          color={formData.role === "trusted" ? '#10B981' : '#666'} 
                        />
                        <Text style={[
                          styles.roleText, 
                          formData.role === "trusted" && styles.roleTextSelected
                        ]}>
                          Trusted Person
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Youth Onboarding Wizard (5 steps) */}
                  {formData.role === 'youth' && (
                                    <View style={{ marginTop: 12 }}>
                                      <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>A few quick questions</Text>
                                      <Text style={{ color: '#6B7280', marginBottom: 12 }}>Help us personalize your experience — it only takes a moment.</Text>

                                      <TouchableOpacity
                                        style={[styles.roleBtn, { justifyContent: 'center' }]}
                                        onPress={() => navigation.navigate('OnboardingWizard', { role: 'youth', returnTo: 'Signup' })}
                                      >
                                        <Text style={{ color: '#10B981', fontWeight: '700' }}>Open onboarding wizard</Text>
                                      </TouchableOpacity>
                                      {/* If onboardingAnswers were returned via navigation params, merge them */}
                                      {route?.params?.onboardingAnswers && (
                                        <View style={{ marginTop: 12 }}>
                                          <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600' }}>Answers saved</Text>
                                        </View>
                                      )}
                                    </View>
                                  )}

                  <TouchableOpacity
                    style={[
                      styles.signUpButton,
                      (Object.keys(errors).length > 0 || loading) && styles.signUpButtonDisabled
                    ]}
                    onPress={handleSignup}
                    disabled={loading || Object.keys(errors).length > 0}
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
                  </TouchableOpacity>

                  {/* Login Link */}
                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already part of our community? </Text>
                    <TouchableOpacity onPress={goToLogin}>
                      <Text style={styles.loginLink}>Welcome back!</Text>
                    </TouchableOpacity>
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
                <TouchableOpacity 
                  onPress={() => setShowGenderModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
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
                  </TouchableOpacity>
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
