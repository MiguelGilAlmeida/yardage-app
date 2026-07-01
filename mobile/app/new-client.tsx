import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { colors, fonts, radius } from '../lib/theme'

export default function NewClientScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name required', "Please enter the client's name.")
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      })
      .select()
      .single()
    setLoading(false)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    router.replace(`/client/${data.id}`)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Client</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={colors.lightGray}
          autoFocus
          returnKeyType="next"
        />

        <Text style={styles.label}>Email (Optional)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. john@example.com"
          placeholderTextColor={colors.lightGray}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <Text style={styles.label}>Phone (Optional)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. +1 555 000 0000"
          placeholderTextColor={colors.lightGray}
          keyboardType="phone-pad"
          returnKeyType="next"
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional"
          placeholderTextColor={colors.lightGray}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={save}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving…' : 'Create Client'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  backBtn: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.lightGray },
  content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 60 },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 20,
  },
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
  },
  textArea: { height: 100, paddingTop: 14 },
  button: {
    backgroundColor: colors.black,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 36,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontFamily: fonts.sansBold, color: colors.warmWhite, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
})
