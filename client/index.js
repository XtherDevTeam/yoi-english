import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';
import {
  Platform,
  UIManager,
} from 'react-native';
import { Dirs } from 'react-native-file-access';

import { CacheManager } from '@georstat/react-native-image-cache';
import { registerGlobals } from '@livekit/react-native';

import App from './App';

registerGlobals();

CacheManager.config = {
  baseDir: `${Dirs.CacheDir}/images_cache/`,
  blurRadius: 15,
  cacheLimit: 0,
  maxRetries: 3 /* optional, if not provided defaults to 0 */,
  retryDelay: 3000 /* in milliseconds, optional, if not provided defaults to 0 */,
  sourceAnimationDuration: 1000,
  thumbnailAnimationDuration: 1000,
};

CacheManager.clearCache()

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

registerRootComponent(App)