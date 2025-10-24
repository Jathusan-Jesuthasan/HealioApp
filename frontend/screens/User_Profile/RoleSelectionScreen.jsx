import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RoleSelectionScreen({ navigation, route }) {
  const { userData } = route.params || {};
  const { setUserRole, setAuthFromBackend } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState("");

  const roles = [
    {
      id: "youth",
      title: "Youth User",
      description: "I'm a young person looking for mental health support and wellness tracking",
      icon: "happy-outline",
      color: "#10B981",
      features: [
        "Mood tracking and insights",
        "Personalized activities",
        "Community support",
        "Help center access"
      ]
    },
    {
      id: "trusted",
      title: "Trusted Person",
      description: "I'm a parent, guardian, or trusted adult supporting a young person",
      icon: "shield-checkmark-outline",
      color: "#667eea",
      features: [
        "Monitor youth progress",
        "Emergency contacts",
        "SOS alerts",
        "Community hub access"
      ]
    }
  ];

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;
    
    try {
      // Store the role in AsyncStorage
      const normalized = selectedRole === 'trusted' ? 'Trusted' : 'Youth';
      await AsyncStorage.setItem("userRole", normalized);

      // If we have a token from signup (passed as userData.token), persist full auth now
      try {
        if (userData?.token && typeof setAuthFromBackend === 'function') {
          // Build minimal auth payload expected by context
          const payload = {
            token: userData.token,
            role: normalized,
            user: {
              name: userData.name,
              email: userData.email,
              _id: userData._id,
              role: normalized,
            },
          };
          await setAuthFromBackend(payload);
          // After persisting auth, navigate to role-specific dashboard
          const dest = normalized === 'Trusted' ? 'TrustedDashboard' : 'YouthDashboard';
          return navigation.reset({ index: 0, routes: [{ name: dest }] });
        }
      } catch (e) {
        console.warn('Failed to persist auth after role selection', e);
      }

      // Update the AuthContext with the new role
      setUserRole(normalized);
      // Navigate to the appropriate dashboard for the selected role
      const dest = normalized === 'Trusted' ? 'TrustedDashboard' : 'YouthDashboard';
      return navigation.reset({ index: 0, routes: [{ name: dest }] });
    } catch (error) {
      console.error("Error setting user role:", error);
    }
  };

  return (
    <LinearGradient colors={["#4A90E2", "#10B981"]} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require("../../assets/healio_logo.png")} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Choose Your Role</Text>
              <Text style={styles.subtitle}>
                Select how you'd like to use Healio
              </Text>
            </View>

            {/* Role Selection Cards */}
            <View style={styles.rolesContainer}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    selectedRole === role.id && styles.roleCardSelected
                  ]}
                  onPress={() => handleRoleSelection(role.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.roleHeader}>
                    <View style={[
                      styles.roleIconContainer,
                      { backgroundColor: `${role.color}20` }
                    ]}>
                      <Ionicons 
                        name={role.icon} 
                        size={32} 
                        color={role.color} 
                      />
                    </View>
                    <View style={styles.roleTitleContainer}>
                      <Text style={[
                        styles.roleTitle,
                        selectedRole === role.id && styles.roleTitleSelected
                      ]}>
                        {role.title}
                      </Text>
                      <Text style={[
                        styles.roleDescription,
                        selectedRole === role.id && styles.roleDescriptionSelected
                      ]}>
                        {role.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featuresContainer}>
                    <Text style={[
                      styles.featuresTitle,
                      selectedRole === role.id && styles.featuresTitleSelected
                    ]}>
                      What you'll get:
                    </Text>
                    {role.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons 
                          name="checkmark-circle" 
                          size={16} 
                          color={selectedRole === role.id ? "#fff" : role.color} 
                        />
                        <Text style={[
                          styles.featureText,
                          selectedRole === role.id && styles.featureTextSelected
                        ]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {selectedRole === role.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Continue Button */}
            <TouchableOpacity 
              style={[
                styles.continueButton,
                !selectedRole && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={!selectedRole}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  keyboardView: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: "center"
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  logo: {
    width: 60,
    height: 60
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 22
  },
  rolesContainer: {
    gap: 20,
    marginBottom: 40
  },
  roleCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative"
  },
  roleCardSelected: {
    backgroundColor: "#4A90E2",
    borderColor: "#fff"
  },
  roleHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16
  },
  roleTitleContainer: {
    flex: 1
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8
  },
  roleTitleSelected: {
    color: "#fff"
  },
  roleDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20
  },
  roleDescriptionSelected: {
    color: "rgba(255,255,255,0.8)"
  },
  featuresContainer: {
    marginBottom: 10
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12
  },
  featuresTitleSelected: {
    color: "#fff"
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6B7280",
    flex: 1
  },
  featureTextSelected: {
    color: "rgba(255,255,255,0.9)"
  },
  selectedIndicator: {
    position: "absolute",
    top: 16,
    right: 16
  },
  continueButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  continueButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8
  }
});
