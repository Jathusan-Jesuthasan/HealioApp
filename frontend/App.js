// App.js
import React, { useContext, useEffect, useState, memo } from "react";
import { View, ActivityIndicator, Text, LogBox } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { navigationRef } from "./navigation/NavigationService";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import api from "./config/api";
import Toast from 'react-native-toast-message';
// Context providers
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { GoalsProvider } from "./context/GoalsContext";
import { ActivityProvider } from "./context/ActivityContext";

// Components
import BottomNavBar from "./components/BottomNavBar";
import HeaderBar from "./components/HeaderBar";

// ---- Core screens ----
import WelcomeScreen from "./screens/WelcomeScreen";
import OnboardingScreen1 from "./screens/OnboardingScreen1";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MoodLogScreen from "./screens/MoodLogScreen"; // 👈 added
import React, { useContext, useEffect, useState, memo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import "react-native-reanimated";
import { ThemeProvider } from "./context/ThemeContext";

import { AuthProvider, AuthContext } from "./context/AuthContext";

// Ignore noisy RN-web responder warnings in development (safe to suppress)
LogBox.ignoreLogs([
  "Unknown event handler property",
  "Invalid DOM property",
  "Invalid DOM property `transform-origin`. Did you mean `transformOrigin`?",
  "props.pointerEvents is deprecated",
  "Unknown event handler property `onStartShouldSetResponder`",
  "Unknown event handler property `onResponderTerminationRequest`",
  "Unknown event handler property `onResponderGrant`",
  "Unknown event handler property `onResponderMove`",
  "Unknown event handler property `onResponderRelease`",
  "Unknown event handler property `onResponderTerminate`",
  "Unknown event handler property `onResponder",
]);
import { OnboardingProvider, OnboardingContext } from "./context/OnboardingContext";
import BottomNavBar from "./components/BottomNavBar";
import YouthBottomNavBar from "./components/YouthBottomNavBar";
import TrustedBottomNavBar from "./components/TrustedBottomNavBar";
import SOSFab from "./components/SOSFab";
import { useNavigation } from "@react-navigation/native";
import HeaderBar from "./components/HeaderBar";

// 🧩 Core Screens
import WelcomeScreen from "./screens/User_Profile/WelcomeScreen";
import OnboardingScreen1 from "./screens/User_Profile/OnboardingScreen1";
import LoginScreen from "./screens/User_Profile/LoginScreen";
import SignupScreen from "./screens/User_Profile/SignupScreen";
import YouthQuestionnaireScreen from "./screens/User_Profile/YouthQuestionnaireScreen";
import RoleSelectionScreen from "./screens/User_Profile/RoleSelectionScreen";
import OnboardingWizard from "./screens/User_Profile/OnboardingWizard";
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/User_Profile/ProfileScreen";
import MoodLogScreen from './screens/MoodInsight/MoodLogScreen';
import MoodHistoryScreen from './screens/MoodInsight/MoodHistoryScreen';
import MoodResultScreen from './screens/MoodInsight/MoodResultScreen';

// 👤 Profile-related
import PersonalInfoScreen from "./screens/User_Profile/PersonalInfoScreen";
import NotificationsScreen from "./screens/User_Profile/NotificationsScreen";
import LanguageScreen from "./screens/User_Profile/LanguageScreen";
import ThemeScreen from "./screens/User_Profile/ThemeScreen";
import InviteFriendsScreen from "./screens/Youth_User/InviteTrustedContactScreen";
import TrustedContactsScreen from "./screens/Trusted_Contact/TrustedContactsScreen";
import AddTrustedContact from "./screens/Youth_User/AddTrustedContact";
import EmergencyContactScreen from "./screens/Youth_User/EmergencyContactScreen";
import YouthDashboardScreen from "./screens/Youth_User/YouthDashboardScreen";
import SecurityScreen from "./screens/Youth_Trusted/SecurityScreen";
import HelpCenterScreen from "./screens/User_Profile/HelpCenterScreen";
import KnowledgeHubScreen from "./screens/Youth_Trusted/KnowledgeHubScreen";
import MessagesScreen from "./screens/Trusted_Contact/MessagesScreen";
import ChatScreen from "./screens/Trusted_Contact/ChatScreen";
import LogoutScreen from "./screens/User_Profile/LogoutScreen";
import SOSScreen from "./screens/Youth_User/SOSScreen";
import RoleManagementScreen from "./screens/User_Profile/RoleManagementScreen";
import TrustedDashboardScreen from "./screens/Trusted_Contact/TrustedDashboardScreen";
import CommunityHubScreen from "./screens/Youth_Trusted/CommunityHubScreen";
// Chat screens handled elsewhere

// Temporary placeholders
const Stub = ({ label }) => (
  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
    <Text>{label}</Text>
  </View>
);
const ChatScreen = () => <Stub label="Chat" />;
const ActivityScreen = () => <Stub label="Personalized Activity" />;
import MoodLogScreen from "./screens/MoodLogScreen";
import ChatbotScreen from "./screens/ChatbotScreen";
import ActivityScreen from "./screens/ActivityScreen";
import ActivityDetailScreen from "./screens/ActivityDetailScreen";
import ExerciseListScreen from "./screens/ExerciseListScreen";
import ExerciseDetailScreen from "./screens/ExerciseDetailScreen";
import MeditationScreen from "./screens/MeditationScreen";
import GoalSetupScreen from "./screens/GoalSetupScreen";
import ProgressScreen from "./screens/ProgressScreen";
import RewardsScreen from "./screens/RewardsScreen";
import JournalScreen from "./screens/JournalScreen";
import MusicScreen from "./screens/MusicScreen";
//import ActivityDashboardScreen from "./screens/ActivityDashboardScreen";

// ---- Profile-related screens ----
import PersonalInfoScreen from "./screens/PersonalInfoScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import LanguageScreen from "./screens/LanguageScreen";
import ThemeScreen from "./screens/ThemeScreen";
import InviteFriendsScreen from "./screens/InviteFriendsScreen";
import TrustedContactsScreen from "./screens/TrustedContactsScreen";
import EmergencyContactScreen from "./screens/EmergencyContactScreen";
import YouthDashboardScreen from "./screens/YouthDashboardScreen";
import SecurityScreen from "./screens/SecurityScreen";
import HelpCenterScreen from "./screens/HelpCenterScreen";
import KnowledgeHubScreen from "./screens/KnowledgeHubScreen";
import MessagesScreen from "./screens/MessagesScreen";
import LogoutScreen from "./screens/LogoutScreen";
//import ActivityDetailsScreen from "./screens/ActivityDetailsScreen";
// ---- Navigators ----
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ---------- Helper: add the Healio Header to screens ---------- */
const withHeader =
  (Component, unreadCount = 3) =>
    (props) => (
      <View style={{ flex: 1 }}>
        <HeaderBar navigation={props.navigation} unreadCount={unreadCount} />
        <Component {...props} />
      </View>
    );

/* ------------------- Profile stack (inside Profile tab) ------------------- */
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ProfileMain">
      <Stack.Screen name="ProfileMain" component={withHeader(ProfileScreen)} />

      {/* General */}
      <Stack.Screen name="PersonalInfo" component={withHeader(PersonalInfoScreen)} />
      <Stack.Screen name="Notifications" component={withHeader(NotificationsScreen)} />
      <Stack.Screen name="Language" component={withHeader(LanguageScreen)} />
      <Stack.Screen name="Theme" component={withHeader(ThemeScreen)} />
      <Stack.Screen name="InviteFriends" component={withHeader(InviteFriendsScreen)} />

      {/* Youth / Trusted */}
      <Stack.Screen name="TrustedContacts" component={withHeader(TrustedContactsScreen)} />
      <Stack.Screen name="EmergencyContact" component={withHeader(EmergencyContactScreen)} />
      <Stack.Screen name="YouthDashboard" component={withHeader(YouthDashboardScreen)} />

      {/* Privacy & Community */}
      <Stack.Screen name="Security" component={withHeader(SecurityScreen)} />
      <Stack.Screen name="HelpCenter" component={withHeader(HelpCenterScreen)} />
      <Stack.Screen name="KnowledgeHub" component={withHeader(KnowledgeHubScreen)} />
      <Stack.Screen name="Messages" component={withHeader(MessagesScreen)} />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ headerShown: false }}
      />
      {/* Account */}
      <Stack.Screen name="Logout" component={withHeader(LogoutScreen)} />
    </Stack.Navigator>
  );
}

/* ✅ Pre-wrap all components before navigator registration */
const DashboardWithHeader = withHeader(DashboardScreen);
const MoodWithHeader = withHeader(MoodLogScreen);
const ActivityWithHeader = withHeader(ActivityScreen);
const ProfileWithHeader = withHeader(ProfileScreen);
const PersonalInfoWithHeader = withHeader(PersonalInfoScreen);
const NotificationsWithHeader = withHeader(NotificationsScreen);
const LanguageWithHeader = withHeader(LanguageScreen);
const ThemeWithHeader = withHeader(ThemeScreen);
const YouthQuestionnaireWithHeader = withHeader(YouthQuestionnaireScreen);
const RoleSelectionWithHeader = withHeader(RoleSelectionScreen);
const InviteWithHeader = withHeader(InviteFriendsScreen);
const AddTrustedWithHeader = withHeader(AddTrustedContact);
const TrustedContactsWithHeader = withHeader(TrustedContactsScreen);
const EmergencyWithHeader = withHeader(EmergencyContactScreen);
const YouthDashWithHeader = withHeader(YouthDashboardScreen);
const TrustedDashWithHeader = withHeader(TrustedDashboardScreen);
const RoleManageWithHeader = withHeader(RoleManagementScreen);
const CommunityHubWithHeader = withHeader(CommunityHubScreen);
const SecurityWithHeader = withHeader(SecurityScreen);
const HelpCenterWithHeader = withHeader(HelpCenterScreen);
const KnowledgeHubWithHeader = withHeader(KnowledgeHubScreen);
const MessagesWithHeader = withHeader(MessagesScreen);
const LogoutWithHeader = withHeader(LogoutScreen);
// Provide a ChatWithHeader alias so tabs referencing it don't crash.
const ChatWithHeader = withHeader(ChatScreen);
const ChatRoomWithHeader = withHeader(ChatScreen);
// Chat wrappers removed (restored to prior state)

/* ---------------- PROFILE STACK ---------------- */
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileWithHeader} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoWithHeader} />
      <Stack.Screen name="Notifications" component={NotificationsWithHeader} />
      <Stack.Screen name="Language" component={LanguageWithHeader} />
      <Stack.Screen name="Theme" component={ThemeWithHeader} />
  <Stack.Screen name="YouthQuestionnaire" component={YouthQuestionnaireWithHeader} />
  <Stack.Screen name="RoleSelection" component={RoleSelectionWithHeader} />

      {/* Mood Insight */}
      <Stack.Screen name="MoodLog" component={withHeader(MoodLogScreen)} />
      <Stack.Screen name="MoodHistory" component={withHeader(MoodHistoryScreen)} />
      <Stack.Screen name="MoodResult" component={withHeader(MoodResultScreen)} />

      {/* Trusted Contact */}
      <Stack.Screen name="InviteFriends" component={InviteWithHeader} />
      <Stack.Screen name="AddTrustedContact" component={AddTrustedWithHeader} />
      <Stack.Screen name="TrustedContacts" component={TrustedContactsWithHeader} />
      <Stack.Screen name="EmergencyContact" component={EmergencyWithHeader} />
      <Stack.Screen name="YouthDashboard" component={YouthDashWithHeader} />
      <Stack.Screen name="TrustedDashboard" component={TrustedDashWithHeader} />
  <Stack.Screen name="ChatRoom" component={ChatRoomWithHeader} />

      {/* Privacy / Community */}
      <Stack.Screen name="RoleManagement" component={RoleManageWithHeader} />
      <Stack.Screen name="CommunityHub" component={CommunityHubWithHeader} />
      <Stack.Screen name="Security" component={SecurityWithHeader} />
      <Stack.Screen name="HelpCenter" component={HelpCenterWithHeader} />
      <Stack.Screen name="KnowledgeHub" component={KnowledgeHubWithHeader} />
      <Stack.Screen name="Messages" component={MessagesWithHeader} />
      <Stack.Screen name="SOS" component={SOSScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Logout" component={LogoutWithHeader} />
    </Stack.Navigator>

    
    
  );
}

/* ---------------- YOUTH USER TABS ---------------- */
function YouthUserTabs() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <YouthBottomNavBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={DashboardWithHeader} />
        <Tab.Screen name="Activity" component={ActivityWithHeader} />
        <Tab.Screen name="MoodLog" component={MoodWithHeader} />
        <Tab.Screen name="Chat" component={ChatWithHeader} />
        <Tab.Screen name="Community" component={CommunityHubWithHeader} />
        <Tab.Screen name="Profile" component={ProfileStack} />
      </Tab.Navigator>

      {/* Floating SOS FAB for youth users - opens the SOS screen inside Profile stack */}
      <SOSFab onPress={() => navigation.navigate("Profile", { screen: "SOS" })} />
      {/* Floating chat actions removed (undo) */}
    </View>
  );
}

/* ---------------- TRUSTED PERSON TABS ---------------- */
function TrustedPersonTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TrustedBottomNavBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={withHeader(DashboardScreen)} />
      <Tab.Screen name="Chat" component={withHeader(ChatScreen)} />
      <Tab.Screen name="MoodLog" component={withHeader(MoodLogScreen)} />
      <Tab.Screen name="Activity" component={withHeader(ActivityScreen)} />
      {/* Keep tab name "Profile" so navigation.navigate('Profile') switches tabs */}
      <Tab.Screen name="TrustedDashboard" component={TrustedDashWithHeader} />
      <Tab.Screen name="Analytics" component={TrustedDashWithHeader} />
  <Tab.Screen name="Chat" component={ChatWithHeader} />
      <Tab.Screen name="Community" component={CommunityHubWithHeader} />
      <Tab.Screen name="Profile" component={ProfileStack} />
        <Tab.Screen name="ActivityDetail" component={withHeader(ActivityDetailScreen)} />
        <Tab.Screen name="Journal" component={withHeader(JournalScreen)} />
        <Tab.Screen name="ExerciseList" component={withHeader(ExerciseListScreen)} />
        <Tab.Screen name="ExerciseDetail" component={withHeader(ExerciseDetailScreen)} />
        <Tab.Screen name="Meditation" component={withHeader(MeditationScreen)} />
        <Tab.Screen name="GoalSetup" component={withHeader(GoalSetupScreen)} />
        <Tab.Screen name="Progress" component={withHeader(ProgressScreen)} />
        <Tab.Screen name="Rewards" component={withHeader(RewardsScreen)} />
        <Tab.Screen name="Music" component={withHeader(MusicScreen)} />
        <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}


/* ---------------- AUTH STACK ---------------- */
function AuthStack() {
  const { hasOnboarded } = useContext(OnboardingContext);

  return (
    <Stack.Navigator
      initialRouteName={hasOnboarded ? "Login" : "Welcome"}
      screenOptions={{ headerShown: false }}
    >
      {!hasOnboarded && (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
        </>
      )}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
  <Stack.Screen name="OnboardingWizard" component={OnboardingWizard} />
      <Stack.Screen name="YouthQuestionnaire" component={YouthQuestionnaireScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
    </Stack.Navigator>
  );
}

/* ------------------- Root Navigator ------------------- */
function RootNavigator() {
  const { userToken, userRole, loading } = useContext(AuthContext);

  useEffect(() => {
    const checkFlags = async () => {
      try {
        const v = await AsyncStorage.getItem("hasOnboarded");
        setHasOnboarded(!!v);
      } catch (e) {
        console.error("Error checking onboarding/token:", e);
      } finally {
        setChecking(false);
      }
    };
    checkFlags();
  }, []);

  if (loading || checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={DefaultTheme}>
      {userToken ? (
  userRole === "Trusted" ? <TrustedPersonTabs /> : <YouthUserTabs />
      ) : (
        <AuthStack />
      )}
      {userToken ? <AppTabs /> : <AuthStack hasOnboarded={hasOnboarded} setHasOnboarded={setHasOnboarded} />}
    </NavigationContainer>
  );
}

/* ---------------- APP ENTRY ---------------- */
export default function App() {
  // ✅ Test backend connection once app starts
  useEffect(() => {
    api
      .get("/health")
      .then((res) => {
        console.log("✅ Backend connected:", res.data);
      })
      .catch((err) => {
        console.error("❌ Backend connection failed:", err.message);
      });
  }, []);

  return (
    <ThemeProvider>
    <AuthProvider>
      <OnboardingProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </OnboardingProvider>
    </AuthProvider>
    </ThemeProvider>
  );

  
}
