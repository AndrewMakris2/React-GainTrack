import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const isWeb = Platform.OS === 'web';

function TabBarIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.4 }}>
      {emoji}
    </Text>
  );
}

function ScanTabButton({ onPress, accessibilityState }: any) {
  const focused = accessibilityState?.selected;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={scanStyles.outer}
      activeOpacity={0.8}
    >
      <View style={[scanStyles.inner, focused && scanStyles.innerFocused]}>
        <Text style={scanStyles.icon}>📷</Text>
      </View>
    </TouchableOpacity>
  );
}

const scanStyles = StyleSheet.create({
  outer: {
    top: isWeb ? 0 : -20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    paddingBottom: isWeb ? 4 : 0,
  },
  inner: {
    width: isWeb ? 42 : 62,
    height: isWeb ? 42 : 62,
    borderRadius: isWeb ? 21 : 31,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  innerFocused: {
    backgroundColor: '#EA6800',
  },
  icon: {
    fontSize: isWeb ? 18 : 26,
  },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = isWeb ? 58 : 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0D0D',
          borderTopColor: '#1F1F1F',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: isWeb ? 0 : insets.bottom,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#4B5563',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarButton: isWeb ? undefined : (props) => <ScanTabButton {...props} />,
          tabBarIcon: isWeb ? ({ focused }) => <TabBarIcon emoji="📷" focused={focused} /> : undefined,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
