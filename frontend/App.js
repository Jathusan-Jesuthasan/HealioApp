// App.js
import React, { useContext, useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider, AuthContext } from "./context/AuthContext";

// Screens
import WelcomeScreen from "./screens/WelcomeScreen";
import OnboardingScreen1 from "./screens/OnboardingScreen1";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Stack = createNativeStackNavigator();

/* ---------------- App (authenticated) ---------------- */
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: true, headerTitle: "Profile" }}
      />
    </Stack.Navigator>
  );
}

/* ---------------- Auth (unauthenticated) ---------------- */
function AuthStack({ hasOnboarded, setHasOnboarded }) {
  return (
    <Stack.Navigator
      initialRouteName={hasOnboarded ? "Login" : "Welcome"}
      screenOptions={{ headerShown: false }}
    >
      {!hasOnboarded && (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen
            name="Onboarding1"
            component={(props) => (
              <OnboardingScreen1 {...props} setHasOnboarded={setHasOnboarded} />
            )}
          />
        </>
      )}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: true, headerTitle: "Login" }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: true, headerTitle: "Sign Up" }}
      />
    </Stack.Navigator>
  );
}

/* ---------------- Root Navigator ---------------- */
function RootNavigator() {
  const { userToken, loading } = useContext(AuthContext);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check AsyncStorage for onboarding flag
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem("hasOnboarded");
        setHasOnboarded(!!value);
      } catch (err) {
        console.error("Error checking onboarding:", err);
      } finally {
        setChecking(false);
      }
    };
    checkOnboarding();
  }, []);

  if (loading || checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DefaultTheme}>
      {userToken ? (
        <AppStack />
      ) : (
        <AuthStack hasOnboarded={hasOnboarded} setHasOnboarded={setHasOnboarded} />
      )}
    </NavigationContainer>
  );
}

/* ---------------- App (entry) ---------------- */
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
