import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getLocalIp = () => {
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return 'localhost';
};

export const DEFAULT_API_URL = `http://${getLocalIp()}:5000`;

const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 15000,
});

// Interceptor to load token and base URL dynamically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
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
