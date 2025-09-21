// App.js
import React, { useContext } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, AuthContext } from "./context/AuthContext";

// Screens
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MoodLogScreen from "./screens/MoodLogScreen"; // 👈 added

const Stack = createNativeStackNavigator();

/* ---------------- AppStack ---------------- */
function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="MoodLog" // 👈 start here after login
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="MoodLog" component={MoodLogScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: true, headerTitle: "Profile" }}
      />
    </Stack.Navigator>
  );
}

/* ---------------- AuthStack ---------------- */
function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
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

/* ---------------- RootNavigator ---------------- */
function RootNavigator() {
  const { userToken, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DefaultTheme}>
      {userToken ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

/* ---------------- App (main entry) ---------------- */
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
