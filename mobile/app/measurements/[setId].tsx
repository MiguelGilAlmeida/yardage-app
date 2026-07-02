import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
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
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors, fonts, radius } from '../../lib/theme'

const DB_KEY: Record<string, string> = {
  chest:        'chest',
  stomach:      'stomach',
  bicep:        'bicep',
  shoulder:     'shoulder',
  sleeveLength: 'sleeve_length',
  backLength:   'back_length',
  vestLength:   'vest_length',
  waist:        'waist',
  hip:          'hip',
  outseam:      'outseam',
  inseam:       'inseam',
  legOpen:      'leg_open',
  shirtLength:  'shirt_length',
  neck:         'neck',
  thigh:        'thigh',
  calf:         'calf',
  cuff:         'cuff',
  urise:        'rise',
}

const ALL_FIELDS: { key: string; label: string }[] = [
  { key: 'chest',        label: 'Chest' },
  { key: 'stomach',      label: 'Stomach' },
  { key: 'shoulder',     label: 'Shoulder' },
  { key: 'backLength',   label: 'Back Length' },
  { key: 'bicep',        label: 'Bicep' },
  { key: 'sleeveLength', label: 'Sleeve Length' },
  { key: 'cuff',         label: 'Cuff' },
  { key: 'neck',         label: 'Neck' },
  { key: 'vestLength',   label: 'Vest Length' },
  { key: 'shirtLength',  label: 'Shirt Length' },
  { key: 'waist',        label: 'Waist' },
  { key: 'hip',          label: 'Hip / Seat' },
  { key: 'thigh',        label: 'Thigh' },
  { key: 'calf',         label: 'Calf' },
  { key: 'outseam',      label: 'Outseam' },
  { key: 'inseam',       label: 'Inseam' },
  { key: 'legOpen',      label: 'Leg Opening' },
  { key: 'urise',        label: 'U-Rise' },
]

export default function MeasurementSetScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>()
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [measureMode, setMeasureMode] = useState<'body' | 'garment'>('body')
  const [unit, setUnit] = useState<'imperial' | 'metric'>('imperial')
  const [values, setValues] = useState<Record<string, string>>({})
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('measurement_sets')
      .select('*')
      .eq('id', setId)
      .single()
      .then(({ data }) => {
        if (data) {
          setLabel(data.label ?? 'Default')
          setMeasureMode(data.measure_mode ?? 'body')
          setUnit(data.unit ?? 'imperial')
          setClientId(data.client_id)
          const loaded: Record<string, string> = {}
          for (const { key } of ALL_FIELDS) {
            const v = data[DB_KEY[key]]
            if (v != null) loaded[key] = String(v)
          }
          setValues(loaded)
        }
        setLoading(false)
      })
  }, [setId])

  async function save() {
    setSaving(true)
    const row: Record<string, unknown> = {
      label: label.trim() || 'Default',
      measure_mode: measureMode,
      unit,
    }
    for (const { key } of ALL_FIELDS) {
      const v = parseFloat(values[key] ?? '')
      row[DB_KEY[key]] = isNaN(v) ? null : v
    }
    const { error } = await supabase.from('measurement_sets').update(row).eq('id', setId)
    setSaving(false)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    router.back()
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Set',
      'Delete this measurement set? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('measurement_sets').delete().eq('id', setId)
            router.back()
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Measurements</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator color={colors.offBlack} />
        </View>
      </View>
    )
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
        <Text style={styles.headerTitle} numberOfLines={1}>{label || 'Measurements'}</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Set Label</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Default, Summer 2024"
          placeholderTextColor={colors.lightGray}
        />

        <Text style={styles.sectionLabel}>Measure Mode</Text>
        <View style={styles.toggle}>
          {(['body', 'garment'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, measureMode === m && styles.toggleBtnActive]}
              onPress={() => setMeasureMode(m)}
            >
              <Text style={[styles.toggleBtnText, measureMode === m && styles.toggleBtnTextActive]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Unit</Text>
        <View style={styles.toggle}>
          {(['imperial', 'metric'] as const).map(u => (
            <TouchableOpacity
              key={u}
              style={[styles.toggleBtn, unit === u && styles.toggleBtnActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.toggleBtnText, unit === u && styles.toggleBtnTextActive]}>
                {u === 'imperial' ? 'Inches' : 'Centimetres'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>
          Measurements ({unit === 'imperial' ? 'inches' : 'cm'})
        </Text>
        <View style={styles.fieldGrid}>
          {ALL_FIELDS.map(({ key, label: fieldLabel }) => (
            <View key={key} style={styles.fieldItem}>
              <Text style={styles.fieldLabel}>{fieldLabel}</Text>
              <TextInput
                style={styles.fieldInput}
                value={values[key] ?? ''}
                onChangeText={v => setValues(prev => ({ ...prev, [key]: v }))}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.lightGray}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteButtonText}>Delete Set</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
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
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 17, color: colors.warmWhite, textAlign: 'center', flex: 1, marginHorizontal: 8 },
  backBtn: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.lightGray },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 28,
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
  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.warmWhite,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.black },
  toggleBtnText: { fontFamily: fonts.sans, fontSize: 13, color: colors.charcoal },
  toggleBtnTextActive: { color: colors.warmWhite, fontFamily: fonts.sansBold },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldItem: { width: '47%' },
  fieldLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.warmWhite,
  },
  button: {
    backgroundColor: colors.black,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 36,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { fontFamily: fonts.sansBold, color: colors.warmWhite, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
  deleteButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#C8A8A8',
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
  },
  deleteButtonText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#A05050', letterSpacing: 1, textTransform: 'uppercase' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomSpacer: { height: 40 },
})
