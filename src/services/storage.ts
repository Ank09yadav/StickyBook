import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  HAS_SEEN_ONBOARDING: 'has_seen_onboarding',
} as const;

export const secureStorage = {
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  get: (key: string) => SecureStore.getItemAsync(key),
  delete: (key: string) => SecureStore.deleteItemAsync(key),
};

export const asyncStorage = {
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  get: (key: string) => AsyncStorage.getItem(key),
  delete: (key: string) => AsyncStorage.removeItem(key),
};
