import { CacheManager } from '@georstat/react-native-image-cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

function setItem(k, v, cb) {
  
  AsyncStorage.setItem(k, JSON.stringify(v), (error, result) => {
    if (!error) {
      cb(true)
    } else {
      cb(false)
    }
  })
}

function removeItem(k, cb) {
  AsyncStorage.removeItem(k, (error) => {
    if (!error) {
      cb(true)
    } else {
      cb(false)
    }
  })
}

function inquireItem(k, cb) {
  AsyncStorage.getItem(k, (error, result) => {
    if (!error && result !== null) {
      cb(true, JSON.parse(result))
    } else {
      cb(false, undefined)
    }
  })
}

function clearImageCache() {
  CacheManager.clearCache()
}

export { clearImageCache, inquireItem, removeItem, setItem };