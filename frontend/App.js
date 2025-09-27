// App.js
import React, { useContext, useEffect, useState, memo } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, AuthContext } from './context/AuthContext';
import BottomNavBar from './components/BottomNavBar';
import HeaderBar from './components/HeaderBar';

// ---- Core screens ----
import WelcomeScreen from './screens/WelcomeScreen';
import OnboardingScreen1 from './screens/OnboardingScreen1';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import MoodLogScreen from './screens/MoodLogScreen';

// ---- Profile-related screens ----
import PersonalInfoScreen from './screens/PersonalInfoScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import LanguageScreen from './screens/LanguageScreen';
import ThemeScreen from './screens/ThemeScreen';
import InviteFriendsScreen from './screens/InviteFriendsScreen';
import TrustedContactsScreen from './screens/TrustedContactsScreen';
import EmergencyContactScreen from './screens/EmergencyContactScreen';
import YouthDashboardScreen from './screens/YouthDashboardScreen';
import SecurityScreen from './screens/SecurityScreen';
import HelpCenterScreen from './screens/HelpCenterScreen';
import KnowledgeHubScreen from './screens/KnowledgeHubScreen';
import MessagesScreen from './screens/MessagesScreen';
import LogoutScreen from './screens/LogoutScreen';

// ---- New feature screens ----
import RiskDetailScreen from './screens/RiskDetailScreen';
import MoodStatsScreen from './screens/MoodStatsScreen';
import ReportScreen from './screens/ReportScreen';

// ---- Simple stubs ----
const Stub = ({ label }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>{label}</Text>
  </View>
);
const ChatScreen = () => <Stub label="Chat" />;
const ActivityScreen = () => <Stub label="Personalized Activity" />;

// ---- Navigators ----
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ---- Header HOC ----
const withHeader =
  (Component, unreadCount = 3) =>
  (props) => (
    <View style={{ flex: 1 }}>
      <HeaderBar navigation={props.navigation} unreadCount={unreadCount} />
      <Component {...props} />
    </View>
  );

// ---- Profile Stack ----
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ProfileMain">
      <Stack.Screen name="ProfileMain" component={withHeader(ProfileScreen)} />
      <Stack.Screen name="PersonalInfo" component={withHeader(PersonalInfoScreen)} />
      <Stack.Screen name="Notifications" component={withHeader(NotificationsScreen)} />
      <Stack.Screen name="Language" component={withHeader(LanguageScreen)} />
      <Stack.Screen name="Theme" component={withHeader(ThemeScreen)} />
      <Stack.Screen name="InviteFriends" component={withHeader(InviteFriendsScreen)} />
      <Stack.Screen name="TrustedContacts" component={withHeader(TrustedContactsScreen)} />
      <Stack.Screen name="EmergencyContact" component={withHeader(EmergencyContactScreen)} />
      <Stack.Screen name="YouthDashboard" component={withHeader(YouthDashboardScreen)} />
      <Stack.Screen name="Security" component={withHeader(SecurityScreen)} />
      <Stack.Screen name="HelpCenter" component={withHeader(HelpCenterScreen)} />
      <Stack.Screen name="KnowledgeHub" component={withHeader(KnowledgeHubScreen)} />
      <Stack.Screen name="Messages" component={withHeader(MessagesScreen)} />
      <Stack.Screen name="Logout" component={withHeader(LogoutScreen)} />
    </Stack.Navigator>
  );
}

// ---- Main App Tabs ----
function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={withHeader(DashboardScreen)} />
      <Tab.Screen name="Chat" component={withHeader(ChatScreen)} />
      <Tab.Screen name="MoodLog" component={withHeader(MoodLogScreen)} />
      <Tab.Screen name="Activity" component={withHeader(ActivityScreen)} />
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
      screenOptions={{ headerShown: false }}>
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

// ---- Root Navigator ----
function RootNavigator() {
  const { userToken, loading } = useContext(AuthContext);
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
    <NavigationContainer theme={DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <>
            {/* Main Tabs */}
            <Stack.Screen name="AppTabs" component={AppTabs} />
            {/* Extra Feature Screens */}
            <Stack.Screen name="RiskDetail" component={withHeader(RiskDetailScreen)} />
            <Stack.Screen name="Report" component={withHeader(ReportScreen)} />
            <Stack.Screen name="MoodStats" component={withHeader(MoodStatsScreen)} />
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
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
