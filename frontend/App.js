// App.js
import React, { useContext, useEffect, useState, memo } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import api from "./config/api";
import  Toast from 'react-native-toast-message';
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
import ActivityDashboardScreen from "./screens/ActivityDashboardScreen";

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

      {/* Account */}
      <Stack.Screen name="Logout" component={withHeader(LogoutScreen)} />
    </Stack.Navigator>
  );
}

/* ------------------- Main Tabs (Authenticated App) ------------------- */
function AppTabs() {
  return (
    <GoalsProvider>
      <Tab.Navigator
        tabBar={(props) => <BottomNavBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={withHeader(DashboardScreen)} />
        <Tab.Screen name="Chat" component={withHeader(ChatbotScreen)} />
        <Tab.Screen name="MoodLog" component={withHeader(MoodLogScreen)} />
        <Tab.Screen name="Activity" component={withHeader(ActivityScreen)} />
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
        <Tab.Screen
          name="ActivityDashboard"
          component={withHeader(ActivityDashboardScreen)}
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </GoalsProvider>
  );
}

/* ------------------- Onboarding Wrapper ------------------- */
const Onboarding1Screen = memo(function Onboarding1Screen(props) {
  const setter = props?.route?.params?.setHasOnboarded;
  return <OnboardingScreen1 {...props} setHasOnboarded={setter} />;
});

/* ------------------- Auth Stack (Login / Signup / Onboarding) ------------------- */
function AuthStack({ hasOnboarded, setHasOnboarded }) {
  return (
    <Stack.Navigator
      initialRouteName={hasOnboarded ? "Login" : "Welcome"}
      screenOptions={{ headerShown: false }}
    >
      {!hasOnboarded && (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen
            name="Onboarding1"
            component={Onboarding1Screen}
            initialParams={{ setHasOnboarded }}
          />
        </>
      )}
      <Stack.Screen name="Login" component={withHeader(LoginScreen, 0)} />
      <Stack.Screen name="Signup" component={withHeader(SignupScreen, 0)} />
    </Stack.Navigator>
  );
}

/* ------------------- Root Navigator ------------------- */
function RootNavigator() {
  const { userToken, loading } = useContext(AuthContext);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [checking, setChecking] = useState(true);

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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DefaultTheme}>
      {userToken ? (
        <AppTabs />
      ) : (
        <AuthStack hasOnboarded={hasOnboarded} setHasOnboarded={setHasOnboarded} />
      )}
    </NavigationContainer>
  );
}
/* ------------------- App (Entry Point) ------------------- */
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
    <AuthProvider>
      <ActivityProvider>
        <StatusBar style="auto" />
        <RootNavigator />
        {/* ✅ Add this to enable toasts globally */}
        <Toast />
      </ActivityProvider>
    </AuthProvider>
  );
}