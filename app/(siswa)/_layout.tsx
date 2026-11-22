import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function SiswaTabLayout() {
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={typeof color === 'string' ? color : '#065f46'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="akademik"
        options={{
          title: 'Akademik',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'ribbon' : 'ribbon-outline'}
              size={22}
              color={typeof color === 'string' ? color : '#065f46'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="presensi"
        options={{
          title: 'Presensi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={22}
              color={typeof color === 'string' ? color : '#065f46'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="catatan"
        options={{
          title: 'Catatan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'medal' : 'medal-outline'}
              size={22}
              color={typeof color === 'string' ? color : '#065f46'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="keuangan"
        options={{
          title: 'Keuangan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={22}
              color={typeof color === 'string' ? color : '#065f46'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
