import React from 'react';
import Remote from './shared/remote'
import { useColorScheme } from 'react-native';
import {
  adaptNavigationTheme,
  PaperProvider,
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
import SignInSelfHosted from './pages/SignInSelfHosted';
import { mdTheme } from './shared/styles';
import Examinations from './pages/Examinations';
import Settings from './pages/Settings';
import SignInEvaluation from './pages/SignInEvaluation';
import WritingExamParticipation from './pages/WritingExamParticipation';
import ReadingExamParticipation from './pages/ReadingExamParticipation';
import WritingExamResultView from './pages/WritingExamResultView';
import ReadingExamResultView from './pages/ReadingExamResultView';
import ExaminationResult from './pages/ExaminationResult';
import OralExamParticipation from './pages/OralExamParticipation';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

const Stack = createNativeStackNavigator()
const Tab = createMaterialBottomTabNavigator()

function MainPage({ }) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="首页" options={{
        tabBarIcon: "home"
      }} component={Home} />
      <Tab.Screen name="测试" options={{
        tabBarIcon: "book"
      }} component={Examinations} />
      <Tab.Screen name="测试记录" options={{
        tabBarIcon: "history"
      }} component={ExaminationResult} />
      <Tab.Screen name="设置" options={{
        tabBarIcon: "cog"
      }} component={Settings} />
    </Tab.Navigator>
  )
}

export default function App() {
  const scheme = useColorScheme()

  return (

    <PaperProvider theme={mdTheme()}>
      <SafeAreaProvider>
        <StatusBar backgroundColor="transparent" translucent={true} />
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
            <Stack.Screen name="Sign In Self Hosted" options={{ headerShown: false }} component={
              SignInSelfHosted
            }
            />
            <Stack.Screen name="Sign In Evaluation" options={{ headerShown: false }} component={
              SignInEvaluation
            }
            />
            <Stack.Screen name="WritingExamParticipation" options={{ headerShown: false }} component={
              WritingExamParticipation
            }
            />
            <Stack.Screen name="ReadingExamParticipation" options={{ headerShown: false }} component={
              ReadingExamParticipation
            }></Stack.Screen>
            <Stack.Screen name="OralExamParticipation" options={{ headerShown: false }} component={
              OralExamParticipation
            }></Stack.Screen>
            <Stack.Screen name="WritingExamResultView" options={{ headerShown: false }} component={
              WritingExamResultView
            }
            />
            <Stack.Screen name="ReadingExamResultView" options={{ headerShown: false }} component={
              ReadingExamResultView
            }
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
