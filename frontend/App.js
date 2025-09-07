// navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from 'screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function Navigation({ theme }) {
  return (
    <NavigationContainer theme={theme}>
   <Stack.Navigator>
   <Stack.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{ headerShown: false }}
   />
</Stack.Navigator>

    </NavigationContainer>
  );
}
