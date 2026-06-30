import { Tabs } from 'expo-router'

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Calculator' }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
