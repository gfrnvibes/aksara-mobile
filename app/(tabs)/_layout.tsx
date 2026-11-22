import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'none',
        headerShown: false,
        tabBarActiveTintColor: '#065f46',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#064e3b' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={typeof color === 'string' ? color : '#065f46'} />
          ),
        }}
      />
      <Tabs.Screen
        name="jadwal"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={typeof color === 'string' ? color : '#065f46'} />
          ),
        }}
      />
      <Tabs.Screen
        name="presensi"
        options={{
          title: 'Presensi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={22} color={typeof color === 'string' ? color : '#065f46'} />
          ),
        }}
      />
      <Tabs.Screen
        name="jurnal"
        options={{
          title: 'Jurnal',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={typeof color === 'string' ? color : '#065f46'} />
          ),
        }}
      />
      <Tabs.Screen
        name="lainnya"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={typeof color === 'string' ? color : '#065f46'} />
          ),
        }}
      />
    </Tabs>
  );
}
