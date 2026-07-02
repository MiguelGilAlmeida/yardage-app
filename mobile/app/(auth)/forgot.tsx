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

export default function ForgotScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function sendReset() {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'Check your email for a reset link.'
            : "Enter your email and we'll send you a reset link."}
        </Text>

        {!sent && (
          <>
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
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={sendReset}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending…' : 'Send Reset Email'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>← Back to sign in</Text>
          </TouchableOpacity>
        </Link>
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
  link: { alignItems: 'center', marginTop: 24 },
  linkText: { fontFamily: fonts.sans, color: colors.warmGray, fontSize: 13 },
})
