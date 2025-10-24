// frontend/navigation/AppNavigator.jsx
import React, { lazy, Suspense } from "react";
import { ActivityIndicator } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomNavBar from "../components/BottomNavBar";
import DashboardScreen from "../screens/DashboardScreen";
import MoodLogScreen from "../screens/MoodLogScreen";

const ProfileScreen = lazy(() => import("../screens/User_Profile/ProfileScreen"));
const PersonalInfoScreen = lazy(() => import("../screens/User_Profile/PersonalInfoScreen"));
const NotificationsScreen = lazy(() => import("../screens/User_Profile/NotificationsScreen"));
const LanguageScreen = lazy(() => import("../screens/User_Profile/LanguageScreen"));
const ThemeScreen = lazy(() => import("../screens/User_Profile/ThemeScreen"));
const RoleManagementScreen = lazy(() => import("../screens/User_Profile/RoleManagementScreen"));
const LogoutScreen = lazy(() => import("../screens/User_Profile/LogoutScreen"));
const MessagesScreen = lazy(() => import("../screens/Trusted_Contact/MessagesScreen"));
const CommunityHubScreen = lazy(() => import("../screens/Youth_Trusted/CommunityHubScreen"));
const TrustedDashboardScreen = lazy(() => import("../screens/Trusted_Contact/TrustedDashboardScreen"));
const TrustedContactsScreen = lazy(() => import("../screens/Trusted_Contact/TrustedContactsScreen"));
const AddTrustedContact = lazy(() => import("../screens/Trusted_Contact/AddTrustedContact"));
const InviteTrustedContactScreen = lazy(() => import("../screens/Youth_User/InviteTrustedContactScreen"));
const EmergencyContactScreen = lazy(() => import("../screens/Youth_User/EmergencyContactScreen"));
const SOSScreen = lazy(() => import("../screens/Youth_User/SOSScreen"));
const HelpCenterScreen = lazy(() => import("../screens/User_Profile/HelpCenterScreen"));
const KnowledgeHubScreen = lazy(() => import("../screens/Youth_Trusted/KnowledgeHubScreen"));

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
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Chat" component={MessagesScreen} />
      <Tab.Screen name="MoodLog" component={MoodLogScreen} />
      <Tab.Screen name="Activity" component={TrustedDashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
