import React, { useContext, useEffect, useState, memo } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthProvider, AuthContext } from "./context/AuthContext";
import BottomNavBar from "./components/BottomNavBar";
import HeaderBar from "./components/HeaderBar";

// ---- Core screens ----
import WelcomeScreen from "./screens/WelcomeScreen";
import OnboardingScreen1 from "./screens/OnboardingScreen1";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";
import ProfileScreen from "./screens/ProfileScreen";

// ---- Profile-related pages ----
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

// ---- Simple stubs for other tabs (replace with your pages when ready) ----
const Stub = ({ label }) => (
  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
    <Text>{label}</Text>
  </View>
);
const ChatScreen = () => <Stub label="Chat" />;
const MoodLogScreen = () => <Stub label="Mood Log (+)" />;
const ActivityScreen = () => <Stub label="Personalized Activity" />;

// ---- Navigators ----
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Helper HOC to inject the fixed HeaderBar above any screen. */
const withHeader =
  (Component, unreadCount = 3) =>
  (props) =>
    (
      <View style={{ flex: 1 }}>
        <HeaderBar navigation={props.navigation} unreadCount={unreadCount} />
        <Component {...props} />
      </View>
    );

/** ------------------- Profile stack (inside Profile tab) ------------------- **/
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={withHeader(ProfileScreen)} />
      {/* General */}
      <Stack.Screen
        name="PersonalInfo"
        component={withHeader(PersonalInfoScreen)}
      />
      <Stack.Screen
        name="Notifications"
        component={withHeader(NotificationsScreen)}
      />
      <Stack.Screen name="Language" component={withHeader(LanguageScreen)} />
      <Stack.Screen name="Theme" component={withHeader(ThemeScreen)} />
      <Stack.Screen
        name="InviteFriends"
        component={withHeader(InviteFriendsScreen)}
      />
      {/* Youth role */}
      <Stack.Screen
        name="TrustedContacts"
        component={withHeader(TrustedContactsScreen)}
      />
      <Stack.Screen
        name="EmergencyContact"
        component={withHeader(EmergencyContactScreen)}
      />
      {/* Trusted role */}
      <Stack.Screen
        name="YouthDashboard"
        component={withHeader(YouthDashboardScreen)}
      />
      {/* Privacy & Community */}
      <Stack.Screen name="Security" component={withHeader(SecurityScreen)} />
      <Stack.Screen name="HelpCenter" component={withHeader(HelpCenterScreen)} />
      <Stack.Screen
        name="KnowledgeHub"
        component={withHeader(KnowledgeHubScreen)}
      />
      <Stack.Screen name="Messages" component={withHeader(MessagesScreen)} />
      {/* Account */}
      <Stack.Screen name="Logout" component={withHeader(LogoutScreen)} />
    </Stack.Navigator>
  );
}

/** ------------------- AppTabs (authenticated) ------------------- **/
function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={withHeader(DashboardScreen)} />
      <Tab.Screen name="Chat" component={withHeader(ChatScreen)} />
      <Tab.Screen name="MoodLog" component={withHeader(MoodLogScreen)} />
      <Tab.Screen name="Activity" component={withHeader(ActivityScreen)} />
      {/* keep tab name "Profile" so navigation.navigate('Profile') switches tabs */}
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

/** ------------- Non-inline wrapper to avoid React Navigation warning ------------- **/
const Onboarding1Screen = memo(function Onboarding1Screen(props) {
  const setter = props?.route?.params?.setHasOnboarded;
  return <OnboardingScreen1 {...props} setHasOnboarded={setter} />;
});

/** ------------------- AuthStack (logged out) ------------------- **/
function AuthStack({ hasOnboarded, setHasOnboarded }) {
  return (
    <Stack.Navigator
      initialRouteName={hasOnboarded ? "Login" : "Welcome"}
      screenOptions={{ headerShown: false }}
    >
      {!hasOnboarded && (
        <>
          {/* Usually splash/onboarding don't need the fixed header */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen
            name="Onboarding1"
            component={Onboarding1Screen}
            initialParams={{ setHasOnboarded }}
          />
        </>
      )}
      {/* If you want the header also on auth screens, wrap them: withHeader(LoginScreen) */}
      <Stack.Screen
        name="Login"
        component={withHeader(LoginScreen, 0)}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={withHeader(SignupScreen, 0)}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

/** ------------------- RootNavigator ------------------- **/
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
        <AuthStack
          hasOnboarded={hasOnboarded}
          setHasOnboarded={setHasOnboarded}
        />
      )}
    </NavigationContainer>
  );
}

/** ------------------- App (entry) ------------------- **/
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
