import React, { useContext, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { AntDesign, FontAwesome, Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";
import { useGoogleAuth } from "../../utils/googleSignIn";
import { auth } from "../../config/firebaseConfig";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const { signIn, loginWithGoogle } = useContext(AuthContext);
  const { request, response, promptAsync, handleResponse } = useGoogleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ role: "youth" });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  const isValidEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).toLowerCase());

  // Email/password sign in
  const handleSignIn = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      return Alert.alert("Oops! 😊", "Please enter both email and password to continue your journey.");
    }
    if (!isValidEmail(trimmedEmail)) {
      return Alert.alert("Email Check", "Please enter a valid email address so we can reach you!");
    }

    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/login", {
        email: trimmedEmail,
        password,
      });
      // If backend returned a profile, use it. Otherwise, fallback to locally selected role from formData.
      const profile = data.profile || { role: formData.role };
      await signIn(data.token, profile);
      Alert.alert("Welcome! 🌟", "Your mental wellness journey continues!");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Let's try again!";
      console.error("Login error:", msg);
      Alert.alert("Login Paused", msg);
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in using expo auth + firebase; falls back to backend/local via context
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const promptResult = await promptAsync();
      console.debug('handleGoogleSignIn - promptResult:', promptResult);
      const user = await handleResponse();
      console.debug('handleGoogleSignIn - firebase user:', user?.email);
      if (user) {
        const profile = {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: formData.role === 'trusted' ? 'Trusted' : 'Youth',
        };
        await signIn(`firebase-${Date.now()}`, profile);
        Alert.alert('Welcome', `Signed in as ${user.displayName}`);
      } else {
        // context fallback will try backend and then local fallback
        const result = await loginWithGoogle(formData.role === 'trusted' ? 'Trusted' : 'Youth');
        if (result) Alert.alert('Welcome', 'Signed in with Google');
        else Alert.alert('Google Sign-In', 'Completed (check your account)');
      }
    } catch (err) {
      console.error('Google sign-in failed:', err?.message || err);
      Alert.alert('Google Sign-In Failed', err?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return Alert.alert("Quick Tip 💡", "Please type your email first so we can help you reset your password.");
    }
    if (!isValidEmail(trimmedEmail)) {
      return Alert.alert("Email Check", "Let's make sure your email is correct!");
    }
    try {
      setLoading(true);
      await api.post("/api/auth/forgot-password", { email: trimmedEmail });
      Alert.alert(
        "Help is on the way! 📧",
        "If that email exists in our system, a reset link has been sent to your inbox."
      );
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Could not send reset link. Please try again in a moment.";
      Alert.alert("Temporary Glitch", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={require("../../assets/auth-bg2.jpg")} // Add a soft gradient or abstract mental health themed background
        style={styles.background}
        blurRadius={2}
      >
        {/* Decorative Elements */}
        <View style={styles.floatingIcons}>
          <View style={[styles.floatingIcon, { top: '17%', left: '5%' }]}>
            <Ionicons name="leaf" size={24} color="#10B981" />
          </View>
          <View style={[styles.floatingIcon, { top: '4%', right: '5%' }]}>
            <Ionicons name="leaf" size={24} color="#10B981" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
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
                source={require("../../assets/healio_logo_login.png")} // Add your app logo - mental health themed
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.subtitle}>
                Your mental wellness journey continues. We're glad you're here.
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
                style={styles.formGradient}
              >
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your email address"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleSignIn}
                    returnKeyType="go"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity onPress={handleForgot} disabled={loading}>
                  <Text style={styles.forgotText}>
                    Forgot your password? <Text style={styles.forgotHighlight}>We can help</Text>
                  </Text>
                </TouchableOpacity>

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

                {/* Sign In Button */}
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={handleSignIn}
                  disabled={loading}
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
                        <Text style={styles.signInText}>Continue Your Journey</Text>
                        <Feather name="arrow-right" size={20} color="#fff" style={styles.buttonIcon} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>New to our community? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                    <Text style={styles.signupLink}>Join us here</Text>
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or connect with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login */}
                <View style={styles.socialContainer}>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.googleButton]}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <Image 
                      source={require("../../assets/google-icon.png")}
                      style={styles.socialIcon}
                    />
                    {loading ? (
                      <ActivityIndicator color="#374151" />
                    ) : (
                      <Text style={styles.socialText}>Google</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            {/* Mental Health Support Message */}
            <View style={styles.supportMessage}>
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              <Text style={styles.supportText}>
                Your mental health journey is safe with us. All data is private and secure.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
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
    marginTop: -30,
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
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
  eyeIcon: {
    padding: 8,
  },
  forgotText: {
    color: '#718096',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 25,
  },
  forgotHighlight: {
    color: '#10B981',
    fontWeight: '600',
  },
  signInButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  signInText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  signupText: {
    color: '#718096',
    fontSize: 15,
  },
  signupLink: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 15,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
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
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
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
});
