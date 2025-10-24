import React, { useContext } from "react";
import { View, ActivityIndicator, Text, LogBox } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { navigationRef } from "./navigation/NavigationService";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
const ActivityScreen = () => <Stub label="Personalized Activity" />;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* 🧱 Higher Order Component with fixed displayName */
const withHeader = (Component, unreadCount = 3) => {
  const Wrapped = (props) => (
    <View style={{ flex: 1 }}>
      <HeaderBar navigation={props.navigation} unreadCount={unreadCount} />
      <Component {...props} />
    </View>
  );
  Wrapped.displayName = `withHeader(${Component.displayName || Component.name || "Screen"})`;
  return Wrapped;
};

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
      <Tab.Screen name="TrustedDashboard" component={TrustedDashWithHeader} />
      <Tab.Screen name="Analytics" component={TrustedDashWithHeader} />
  <Tab.Screen name="Chat" component={ChatWithHeader} />
      <Tab.Screen name="Community" component={CommunityHubWithHeader} />
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

/* ---------------- ROOT NAVIGATOR ---------------- */
function RootNavigator() {
  const { userToken, userRole, loading } = useContext(AuthContext);

  if (loading) {
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
    </NavigationContainer>
  );
}

/* ---------------- APP ENTRY ---------------- */
export default function App() {
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
