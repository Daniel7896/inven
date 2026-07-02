import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureItem } from './secureStore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  // For physical devices & emulators: use the dev server host IP
  // Expo provides the host machine's IP via the manifest
  const debuggerHost = Constants.expoConfig?.hostUri
    ?? Constants.manifest2?.extra?.expoGo?.debuggerHost
    ?? Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const hostIp = debuggerHost.split(':')[0];
    return `http://${hostIp}:5000`;
  }

  // Fallback for Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
};

export const DEFAULT_API_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 15000,
});

// Interceptor to load token and base URL dynamically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getSecureItem('jwt_token');
      const customUrl = await AsyncStorage.getItem('custom_api_url');
      
      if (customUrl && customUrl.trim() !== '') {
        config.baseURL = customUrl.trim();
      } else {
        config.baseURL = DEFAULT_API_URL;
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error loading token in axios interceptor:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
