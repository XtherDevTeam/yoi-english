import React from 'react';

import { useColorScheme } from 'react-native';
import {
  adaptNavigationTheme,
  PaperProvider,
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  createMaterialBottomTabNavigator,
} from '@react-navigation/material-bottom-tabs';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './pages/Home';
import SignIn from './pages/SignIn';
import { mdTheme } from './shared/styles';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

const Stack = createNativeStackNavigator()
const Tab = createMaterialBottomTabNavigator()

function MainPage({ }) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" options={{
        tabBarIcon: "home"
      }} component={Home} />
    </Tab.Navigator>
  )
}

export default function App() {
  const scheme = useColorScheme()

  return (

    <PaperProvider theme={mdTheme()}>
      <SafeAreaProvider>
        <NavigationContainer theme={scheme === 'dark' ? DarkTheme : LightTheme}>

          <Stack.Navigator initialRouteName='MainPage'>
            <Stack.Screen name="MainPage" options={{ headerShown: false }} component={
              MainPage
            }
            />
            <Stack.Screen name="Sign In" options={{ headerShown: false }} component={
              SignIn
            }
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
