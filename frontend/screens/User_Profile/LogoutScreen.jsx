import React, { useContext } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";

export default function LogoutScreen({ navigation }) {
  const { signOut } = useContext(AuthContext);
  
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
              <Text style={styles.title}>Log Out</Text>
              <Text style={styles.subtitle}>Are you sure you want to sign out?</Text>
            </View>

            {/* Main Card */}
            <View style={styles.card}>
              <View style={styles.iconContainer}>
                <Ionicons name="log-out-outline" size={48} color="#EF4444" />
              </View>
              
              <Text style={styles.warningText}>
                You will be signed out of your account and will need to sign in again to access your data.
              </Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.logoutBtn} 
                  onPress={signOut}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-out" size={20} color="#fff" />
                  <Text style={styles.logoutBtnText}>Yes, Log Out</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#667eea" />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    marginBottom: 30
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
  card: {
    backgroundColor: "#F5F7FA",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    alignItems: "center"
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  warningText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32
  },
  buttonContainer: {
    width: "100%",
    gap: 12
  },
  logoutBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  logoutBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8
  },
  cancelBtn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#667eea",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cancelBtnText: {
    color: "#667eea",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8
  }
});
