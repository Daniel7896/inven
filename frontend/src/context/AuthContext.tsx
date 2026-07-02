import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureItem, setSecureItem, deleteSecureItem } from '../config/secureStore';
import api, { DEFAULT_API_URL } from '../config/api';

interface Settings {
  currency: string;
  lowStockThreshold: number;
  paymentMethods: string[];
}

interface User {
  _id: string;
  email: string;
  storeName: string;
  settings: Settings;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  apiUrl: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, storeName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (storeName: string, settings: Partial<Settings>) => Promise<void>;
  setCustomApiUrl: (url: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedToken = await getSecureItem('jwt_token');
      const storedUser = await AsyncStorage.getItem('user_profile');
      const storedApiUrl = await AsyncStorage.getItem('custom_api_url');

      if (storedApiUrl) {
        setApiUrl(storedApiUrl);
      }

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Asynchronously check profile to ensure token is still valid
        try {
          const res = await api.get('/api/auth/profile');
          setUser(res.data);
          await AsyncStorage.setItem('user_profile', JSON.stringify(res.data));
        } catch (e) {
          console.log('Stored token is invalid, logging out...');
          await cleanAuthSession();
        }
      }
    } catch (e) {
      console.error('Error loading stored auth session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanAuthSession = async () => {
    setUser(null);
    setToken(null);
    await deleteSecureItem('jwt_token');
    await AsyncStorage.removeItem('user_profile');
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await api.post('/api/auth/login', { email, password });
      const { token: jwtToken, ...userData } = res.data;
      
      setToken(jwtToken);
      setUser(userData);
      
      await setSecureItem('jwt_token', jwtToken);
      await AsyncStorage.setItem('user_profile', JSON.stringify(userData));
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, storeName: string) => {
    try {
      setIsLoading(true);
      const res = await api.post('/api/auth/register', { email, password, storeName });
      const { token: jwtToken, ...userData } = res.data;

      setToken(jwtToken);
      setUser(userData);

      await setSecureItem('jwt_token', jwtToken);
      await AsyncStorage.setItem('user_profile', JSON.stringify(userData));
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await cleanAuthSession();
    setIsLoading(false);
  };

  const updateSettings = async (storeName: string, settings: Partial<Settings>) => {
    try {
      const res = await api.put('/api/auth/settings', { storeName, settings });
      setUser(res.data);
      await AsyncStorage.setItem('user_profile', JSON.stringify(res.data));
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update settings';
      throw new Error(msg);
    }
  };

  const setCustomApiUrl = async (url: string) => {
    try {
      if (url.trim() === '') {
        await AsyncStorage.removeItem('custom_api_url');
        setApiUrl(DEFAULT_API_URL);
      } else {
        await AsyncStorage.setItem('custom_api_url', url.trim());
        setApiUrl(url.trim());
      }
    } catch (e) {
      console.error('Error saving custom API URL:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        apiUrl,
        login,
        register,
        logout,
        updateSettings,
        setCustomApiUrl
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
