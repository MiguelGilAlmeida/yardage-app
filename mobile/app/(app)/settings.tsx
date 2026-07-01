import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'
import { colors, fonts, radius } from '../../lib/theme'

export default function SettingsScreen() {
  const { session, user } = useAuthStore()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
  }

  function confirmSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    )
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>Cloth & Chalk</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.centerTitle}>Settings</Text>
          <Text style={styles.centerBody}>Sign in to manage your account.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>Cloth & Chalk</Text>
        <View style={styles.headerSide} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={styles.cardValue} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Subscription</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Plan</Text>
            <Text style={styles.cardValue}>Free</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.button, styles.buttonMuted]} disabled>
          <Text style={styles.buttonText}>Upgrade — Coming Soon</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Version</Text>
            <Text style={styles.cardValue}>{Constants.expoConfig?.version ?? '—'}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.outlineButton, { marginTop: 40 }]} onPress={confirmSignOut}>
          <Text style={styles.outlineButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.black,
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: { width: 80 },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: colors.warmWhite, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 28,
  },
  card: {
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.charcoal },
  cardValue: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.offBlack, flex: 1, textAlign: 'right' },
  button: {
    backgroundColor: colors.black,
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonMuted: { opacity: 0.35 },
  buttonText: { fontFamily: fonts.sansBold, color: colors.warmWhite, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: colors.warmWhite,
  },
  outlineButtonText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.charcoal, letterSpacing: 1, textTransform: 'uppercase' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  centerTitle: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.black, marginBottom: 12, textAlign: 'center' },
  centerBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.warmGray, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  bottomSpacer: { height: 40 },
})
