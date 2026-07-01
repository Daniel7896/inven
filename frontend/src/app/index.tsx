import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Theme } from '../constants/Theme';

export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
