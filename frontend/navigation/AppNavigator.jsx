import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Colors } from "../utils/Colors";

import DashboardScreen from "../screens/DashboardScreen";
import MoodLogScreen from "../screens/MoodLogScreen";
import ChatbotScreen from "../screens/ChatbotScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ActivityStack from "./ActivityStack"; // ✅ use stack instead of ActivityScreen
import ActivityDashboardScreen from "../screens/ActivityDashboardScreen";

import BottomNavBar from "../components/BottomNavBar";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="MoodLog"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.navActive ?? Colors.secondary,
        tabBarInactiveTintColor: Colors.navIcon ?? Colors.textSecondary,
      }}
      tabBar={(props) => <BottomNavBar {...props} />}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Chat" component={ChatbotScreen} />
      <Tab.Screen name="MoodLog" component={MoodLogScreen} />
      <Tab.Screen name="Activity" component={ActivityStack} /> {/* ✅ FIXED */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
