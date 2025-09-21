// App.js
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import LaunchScreen from "./screens/LaunchScreen";       // logo splash
import MoodLogScreen from "./screens/MoodLogScreen";     // mood logging
import DashboardScreen from "./screens/DashboardScreen"; // dashboard

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Launch"
        screenOptions={{ headerShown: false }}
      >
        {/* Launch / Logo screen */}
        <Stack.Screen name="Launch" component={LaunchScreen} />

        {/* Mood logging */}
        <Stack.Screen name="MoodLog" component={MoodLogScreen} />

        {/* Dashboard (main app) */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
