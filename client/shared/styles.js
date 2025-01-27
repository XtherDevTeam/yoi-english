import {
  StyleSheet,
  useColorScheme,
} from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
} from 'react-native-paper';

import * as Theme from './theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

function mdTheme() {
  const scheme = useColorScheme()
  // print('THEME',dark)
  const theme = scheme === 'dark' ? { ...MD3DarkTheme, colors: Theme.default.dark.colors } : { ...MD3LightTheme, colors: Theme.default.light.colors }
  return theme
}

function markedTheme() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? Theme.default.darkMarkedStyles : Theme.default.lightMarkedStyles
  return theme
}

export { mdTheme, styles, markedTheme };