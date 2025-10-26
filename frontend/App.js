// App.js
import React, { useContext, useEffect ,useState, memo} from "react";
import { View, ActivityIndicator, LogBox ,Text} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { navigationRef } from "./navigation/NavigationService";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import api from "./config/api";
// Context providers
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { ActivityProvider } from "./context/ActivityContext";
import { GoalsProvider } from "./context/GoalsContext";

// Components
import HeaderBar from "./components/HeaderBar";

// ---- Core screens ----
import "react-native-reanimated";
import { ThemeProvider } from "./context/ThemeContext";


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
import YouthBottomNavBar from "./components/YouthBottomNavBar";
import TrustedBottomNavBar from "./components/TrustedBottomNavBar";
import SOSFab from "./components/SOSFab";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from './utils/Colors'; // ✅ Safe import


// ---- New feature screens ----
import RiskDetectionScreen from './screens/Analysis/RiskDetectionScreen';
import MoodStatsScreen from './screens/Analysis/MoodStatsScreen';
import AIInsightsHistory from './screens/Analysis/AIInsightsHistory';
import TrustedRiskAlert from './screens/Analysis/TrustedRiskAlert';

// ---- Simple stubs ----
const Stub = ({ label }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>{label}</Text>
  </View>
);

// 🧩 Core Screens
import WelcomeScreen from "./screens/User_Profile/WelcomeScreen";
import OnboardingScreen1 from "./screens/User_Profile/OnboardingScreen1";
import LoginScreen from "./screens/User_Profile/LoginScreen";
import SignupScreen from "./screens/User_Profile/SignupScreen";
import YouthQuestionnaireScreen from "./screens/User_Profile/YouthQuestionnaireScreen";
import RoleSelectionScreen from "./screens/User_Profile/RoleSelectionScreen";
import OnboardingWizard from "./screens/User_Profile/OnboardingWizard";
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
import TrustedContactsScreen from "./screens/Trusted_Contact/LinkedContacts";
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
import TrustedAnalyticsScreen from "./screens/Trusted_Contact/TrustedAnalyticsScreen";
import CommunityHubScreen from "./screens/Youth_Trusted/CommunityHubScreen";
// Chat screens handled elsewhere

// Temporary placeholders
import ActivityScreen from "./screens/Activities/ActivityScreen";
import ChatbotScreen from "./screens/Activities/ChatbotScreen";
import ActivityDetailScreen from "./screens/Activities/ActivityDetailScreen";
import ExerciseListScreen from "./screens/Activities/ExerciseListScreen";
import ExerciseDetailScreen from "./screens/Activities/ExerciseDetailScreen";
import MeditationScreen from "./screens/Activities/MeditationScreen";
import GoalSetupScreen from "./screens/Activities/GoalSetupScreen";
import ProgressScreen from "./screens/Activities/ProgressScreen";
import RewardsScreen from "./screens/Activities/RewardsScreen";
import JournalScreen from "./screens/Activities/JournalScreen";
import MusicScreen from "./screens/Activities/MusicScreen";
import DevSettingsScreen from "./screens/Activities/DevSettingsScreen";

// ---- Profile-related screens ----
//import ActivityDetailsScreen from "./screens/ActivityDetailsScreen";
// ---- Navigators ----
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ActivityStack = createNativeStackNavigator();

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


/* ✅ Pre-wrap all components before navigator registration */
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
const TrustedAnalyticsWithHeader = withHeader(TrustedAnalyticsScreen);
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

const ACTIVE_SOS_EXCLUDE_SCREENS = ["Chat", "ChatRoom", "Chatbot"];

const isRouteActive = (state, targets) => {
  if (!state) return false;
  const index = typeof state.index === "number" ? state.index : 0;
  const route = state.routes?.[index];
  if (!route) return false;

  if (targets.includes(route.name)) {
    return true;
  }

  if (route.state) {
    return isRouteActive(route.state, targets);
  }

  if (route.params?.screen && targets.includes(route.params.screen)) {
    return true;
  }

  return false;
};

const AppTabs = () => {
  const { userRole } = useContext(AuthContext);
  return userRole === "Trusted" ? <TrustedPersonTabs /> : <YouthUserTabs />;
};

function ActivityStackNavigator() {
  return (
    <ActivityStack.Navigator screenOptions={{ headerShown: false }}>
      <ActivityStack.Screen name="ActivityMain" component={ActivityWithHeader} />
      <ActivityStack.Screen name="ActivityDetail" component={withHeader(ActivityDetailScreen)} />
      <ActivityStack.Screen name="Journal" component={withHeader(JournalScreen)} />
      <ActivityStack.Screen name="ExerciseList" component={withHeader(ExerciseListScreen)} />
      <ActivityStack.Screen name="ExerciseDetail" component={withHeader(ExerciseDetailScreen)} />
      <ActivityStack.Screen name="Meditation" component={withHeader(MeditationScreen)} />
      <ActivityStack.Screen name="GoalSetup" component={withHeader(GoalSetupScreen)} />
      <ActivityStack.Screen name="Progress" component={withHeader(ProgressScreen)} />
      <ActivityStack.Screen name="Rewards" component={withHeader(RewardsScreen)} />
      <ActivityStack.Screen name="Music" component={withHeader(MusicScreen)} />
      <ActivityStack.Screen name="Chatbot" component={withHeader(ChatbotScreen)} />
  <ActivityStack.Screen name="DevSettings" component={withHeader(DevSettingsScreen)} />
    </ActivityStack.Navigator>
  );
}

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
  const [showSOSFab, setShowSOSFab] = useState(true);

  useEffect(() => {
    const updateVisibility = () => {
      const currentState = navigation.getState?.();
      const shouldHide = isRouteActive(currentState, ACTIVE_SOS_EXCLUDE_SCREENS);
      setShowSOSFab(!shouldHide);
    };

    updateVisibility();

    const unsubscribe = navigation.addListener("state", updateVisibility);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <YouthBottomNavBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={YouthDashWithHeader} />
        <Tab.Screen name="Activity" component={ActivityStackNavigator} />
        <Tab.Screen name="MoodLog" component={MoodWithHeader} />
        <Tab.Screen name="Chat" component={ChatWithHeader} />
        <Tab.Screen name="Community" component={CommunityHubWithHeader} />
        <Tab.Screen name="Profile" component={ProfileStack} />
      </Tab.Navigator>

      {/* Floating SOS FAB for youth users - opens the SOS screen inside Profile stack */}
      {showSOSFab && (
        <SOSFab
          onPress={() =>
            navigation.navigate("AppTabs", {
              screen: "Profile",
              params: { screen: "SOS" },
            })
          }
        />
      )}
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
      <Tab.Screen name="TrustedAnalytics" component={TrustedAnalyticsWithHeader} />
      <Tab.Screen name="Chat" component={ChatWithHeader} />
      <Tab.Screen name="Community" component={CommunityHubWithHeader} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// ---- Onboarding wrapper ----
const Onboarding1Screen = memo(function Onboarding1Screen(props) {
  const setter = props?.route?.params?.setHasOnboarded;
  return <OnboardingScreen1 {...props} setHasOnboarded={setter} />;
});

// ---- Auth Stack ----
function AuthStack({ hasOnboarded, setHasOnboarded }) {
  return (
    <Stack.Navigator
      initialRouteName={hasOnboarded ? 'Login' : 'Welcome'}
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

// ---- App Theme with Colors.js ----
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors?.primary || '#F5F7FA',
    background: Colors?.background || '#F5F7FA',
    card: Colors?.card || '#FFFFFF',
    text: Colors?.textPrimary || '#111827',
    border: Colors?.border || '#E5E7EB',
    notification: Colors?.accent || '#10B981',
  },
};

// ---- Root Navigator ----
function RootNavigator() {
  const { userToken, userRole, loading } = useContext(AuthContext);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkFlags = async () => {
      try {
        const v = await AsyncStorage.getItem('hasOnboarded');
        setHasOnboarded(!!v);
      } catch (e) {
        console.error('Error checking onboarding/token:', e);
      } finally {
        setChecking(false);
      }
    };
    checkFlags();
  }, []);

  if (loading || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={AppTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <>
            {/* Main Tabs */}
            <Stack.Screen name="AppTabs" component={AppTabs} />
            {/* Extra Feature Screens */}
            <Stack.Screen name="RiskDetail" component={withHeader(RiskDetectionScreen)} />
            <Stack.Screen name="MoodStats" component={withHeader(MoodStatsScreen)} />
            <Stack.Screen name="AIInsightsHistory" component={withHeader(AIInsightsHistory)} />
            <Stack.Screen name="TrustedPerson" component={withHeader(TrustedRiskAlert)} />
          </>
        ) : (
          <Stack.Screen name="AuthStack">
            {() => <AuthStack hasOnboarded={hasOnboarded} setHasOnboarded={setHasOnboarded} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
} 


// ---- Entry Point ----
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
      <ActivityProvider>
        <GoalsProvider>
          <OnboardingProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </OnboardingProvider>
        </GoalsProvider>
      </ActivityProvider>
    </AuthProvider>
    </ThemeProvider>
  );

  
}
