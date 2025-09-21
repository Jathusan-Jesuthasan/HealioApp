// App.js
import React, { useContext, useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider, AuthContext } from "./context/AuthContext";

// Screens
import OnboardingScreen from "./screens/OnboardingScreen1";
import LoginScreen from "./screens/LoginScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import MoodLogScreen from "./screens/MoodLogScreen";
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/ProfileScreen";

// UI
import BottomBar from "./components/BottomBar";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ---------- Tabs after login ---------- */
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="MoodLog"         // MoodLog first after login
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomBar {...props} />}
    >
      <Tab.Screen name="MoodLog" component={MoodLogScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
    </Tab.Navigator>
  );
}

/* ---------- App (authenticated) ---------- 
   After login we show Welcome first, then tabs.
*/
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} />   {/* landing/choice */}
      <Stack.Screen name="MainTabs" component={MainTabs} />       {/* MoodLog + Dashboard */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: true, headerTitle: "Profile" }}
      />
    </Stack.Navigator>
  );
}

/* ---------- Auth (unauthenticated) ---------- 
   Only Login here per your flow (onboarding handled by Root).
*/
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

/* ---------- Root Navigator (single stack, always start with Welcome) ---------- */
function RootNavigator() {
  const { userToken } = useContext(AuthContext);
  return (
    <NavigationContainer theme={DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={require('./screens/SignupScreen').default} />
        <Stack.Screen name="MoodLog" component={MoodLogScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: true, headerTitle: "Profile" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* ---------- App entry ---------- */
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
