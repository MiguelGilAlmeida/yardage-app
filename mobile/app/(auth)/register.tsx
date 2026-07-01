import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors, fonts, radius } from '../../lib/theme'

export default function RegisterScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function signUp() {
    if (password !== confirm) {
      Alert.alert('Passwords do not match')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      Alert.alert('Sign up failed', error.message)
    } else {
      Alert.alert('Check your email', 'We sent you a confirmation link.')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start saving client profiles</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.lightGray}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.lightGray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={colors.lightGray}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={signUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontFamily: fonts.serifBold, fontSize: 32, color: colors.black, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.warmGray, marginBottom: 40, letterSpacing: 0.2 },
  input: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.warmWhite,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.black,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontFamily: fonts.sansBold, color: colors.warmWhite, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 44 },
  footerText: { fontFamily: fonts.sans, color: colors.warmGray, fontSize: 13 },
  footerLink: { fontFamily: fonts.sansBold, color: colors.offBlack, fontSize: 13 },
})
