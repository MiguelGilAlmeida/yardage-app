import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts } from '../../lib/theme'

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.warmWhite,
          borderTopColor: colors.rule,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: colors.warmGray,
        tabBarLabelStyle: {
          fontFamily: fonts.sansBold,
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calculate',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
