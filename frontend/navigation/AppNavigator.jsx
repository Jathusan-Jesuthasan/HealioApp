// /navigation/AppNavigator.jsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Colors } from "../utils/Colors";

// Screens
import DashboardScreen from "../screens/DashboardScreen";
import MoodLogScreen from "../screens/MoodLogScreen";
// Optional: add these when ready
// import TrendsScreen from "../screens/TrendsScreen";
// import ReportScreen from "../screens/ReportScreen";
// import SettingsScreen from "../screens/SettingsScreen";

import BottomBar from "../components/BottomBar";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
        }}
        // Use custom bottom bar (rounded + center FAB)
        tabBar={(props) => <BottomBar {...props} />}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="MoodLog" component={MoodLogScreen} />
        {/* Add these when you create the screens */}
        {/* <Tab.Screen name="Trends" component={TrendsScreen} /> */}
        {/* <Tab.Screen name="Reports" component={ReportScreen} /> */}
        {/* <Tab.Screen name="Settings" component={SettingsScreen} /> */}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
