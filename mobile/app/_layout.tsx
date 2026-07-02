import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useFonts } from 'expo-font'
import {
  BodoniModa_400Regular,
  BodoniModa_700Bold,
} from '@expo-google-fonts/bodoni-moda'
import {
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
} from '@expo-google-fonts/jost'
import mobileAds from 'react-native-google-mobile-ads'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'
import { AdContext } from '../lib/adContext'
import { colors } from '../lib/theme'

export default function RootLayout() {
  const { session, setSession } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [adsReady, setAdsReady] = useState(false)
  const router = useRouter()
  const segments = useSegments()

  const [fontsLoaded] = useFonts({
    BodoniModa_400Regular,
    BodoniModa_700Bold,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
  })

  useEffect(() => {
    mobileAds().initialize().then(() => setAdsReady(true)).catch(() => setAdsReady(true))

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading || !fontsLoaded) return
    const inAuthGroup = segments[0] === '(auth)'
    // Only redirect away from auth screens once signed in — never force login
    if (session && inAuthGroup) {
      router.replace('/(app)')
    }
  }, [session, segments, loading, fontsLoaded])

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.offBlack} />
      </View>
    )
  }

  return (
    <AdContext.Provider value={adsReady}>
      <Stack screenOptions={{ headerShown: false }} />
    </AdContext.Provider>
  )
}
