import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Theme } from '../constants/Theme';

function NavigationWrapper() {
  const { user, isLoading } = useAuth();
  const segments = useSegments() as any;
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check if the user is inside the (auth) route group
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Not logged in -> force login screen
      router.replace('/(auth)/login');
    } else if (user && (inAuthGroup || segments.length === 0 || segments[0] === 'index')) {
      // Logged in -> go to tabs dashboard
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NavigationWrapper />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
