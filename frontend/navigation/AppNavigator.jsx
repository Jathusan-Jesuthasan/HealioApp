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
const Stack = createNativeStackNavigator();

/* ---------------- PROFILE STACK ---------------- */
function ProfileStack() {
  return (
    <Suspense fallback={<ActivityIndicator size="large" color="#4A90E2" style={{ flex: 1 }} />}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProfileMain" component={ProfileScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="Theme" component={ThemeScreen} />
        <Stack.Screen name="RoleManagement" component={RoleManagementScreen} />
        <Stack.Screen name="Logout" component={LogoutScreen} />

        {/* Trusted Contact */}
        <Stack.Screen name="TrustedContacts" component={TrustedContactsScreen} />
        <Stack.Screen name="AddTrustedContact" component={AddTrustedContact} />
        <Stack.Screen name="InviteTrustedContact" component={InviteTrustedContactScreen} />
        <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} />
        <Stack.Screen name="SOS" component={SOSScreen} />

        {/* Trusted Person Dashboard */}
        <Stack.Screen name="TrustedDashboard" component={TrustedDashboardScreen} />

        {/* Community & Knowledge */}
        <Stack.Screen name="CommunityHub" component={CommunityHubScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="KnowledgeHub" component={KnowledgeHubScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
      </Stack.Navigator>
    </Suspense>
  );
}

/* ---------------- APP TABS ---------------- */
export default function AppNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="MoodLog"      // 👈 start here after login
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
