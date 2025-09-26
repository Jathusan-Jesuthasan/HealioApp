import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Colors } from "../utils/Colors";

// Screens
import DashboardScreen from "../screens/DashboardScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ProfileScreen from "../screens/ProfileScreen";

import MoodLogScreen from "../screens/MoodLogScreen";
import MoodHistoryScreen from "../screens/MoodHistoryScreen";
import MoodDetailScreen from "../screens/MoodDetailScreen";

import BottomBar from "../components/BottomBar";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Bottom tab routes
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textLight,
      }}
      tabBar={(props) => <BottomBar {...props} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Mood flow screens */}
      <Stack.Screen name="MoodLogScreen" component={MoodLogScreen} />
      <Stack.Screen name="MoodHistoryScreen" component={MoodHistoryScreen} />
      <Stack.Screen name="MoodDetailScreen" component={MoodDetailScreen} />
    </Stack.Navigator>
  );
}
