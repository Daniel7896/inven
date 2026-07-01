import React from 'react';
import { Tabs } from 'expo-router';
import { Theme } from '../../constants/Theme';
import { Home, Package, Scan, Layers, BarChart3, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: Theme.colors.cardBorder,
        },
        headerTintColor: Theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: Theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: Theme.colors.cardBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan Box',
          tabBarLabel: 'Scan Box',
          tabBarIcon: ({ color, size }) => <Scan color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="accessories"
        options={{
          title: 'Accessories',
          tabBarLabel: 'Accessories',
          tabBarIcon: ({ color, size }) => <Layers color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
