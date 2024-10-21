import * as React from 'react';

import { Platform } from 'react-native';
import {
  Appbar,
  PaperProvider,
} from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import { mdTheme } from '../shared/styles';

const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical'

export default function Home({navigation, route}) {
  useFocusEffect(React.useCallback(() => {
    Remote.checkIfLoggedIn().then(r => {
      if (!r) {
        navigation.navigate('Sign In')
      } else {
      }
    })
  }, []))

    return <PaperProvider theme={mdTheme()}>
      <>
        <Appbar.Header>
          <Appbar.Content title={characterList === null ? "Chats (Loading...)" : "Chats"}></Appbar.Content>
          <Appbar.Action icon="plus" onPress={() => navigation.navigate('New Character')}></Appbar.Action>
        </Appbar.Header>
        </>
    </PaperProvider>
}