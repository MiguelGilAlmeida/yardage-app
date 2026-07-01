import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors, fonts, radius } from '../../lib/theme'

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

type MeasurementSet = {
  id: string
  label: string
  measure_mode: string
  unit: string
  created_at: string
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [sets, setSets] = useState<MeasurementSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)
    const [clientRes, setsRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase
        .from('measurement_sets')
        .select('id, label, measure_mode, unit, created_at')
        .eq('client_id', id)
        .order('created_at', { ascending: false }),
    ])
    if (!clientRes.error) setClient(clientRes.data)
    if (!setsRes.error && setsRes.data) setSets(setsRes.data)
    setLoading(false)
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Client',
      `Delete ${client?.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('clients').delete().eq('id', id)
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
          <Text style={styles.headerTitle}>Client</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator color={colors.offBlack} />
        </View>
      </View>
    )
  }

  if (!client) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.centerTitle}>Not found</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{client.name}</Text>
        <TouchableOpacity
          style={[styles.headerSide, styles.headerSideRight]}
          onPress={() => router.push(`/edit-client/${id}`)}
        >
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Info */}
        <Text style={styles.sectionLabel}>Info</Text>
        <View style={styles.card}>
          {client.email ? (
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Email</Text>
              <Text style={styles.cardValue}>{client.email}</Text>
            </View>
          ) : null}
          {client.phone ? (
            <View style={[styles.cardRow, client.email ? styles.cardRowBorder : null]}>
              <Text style={styles.cardLabel}>Phone</Text>
              <Text style={styles.cardValue}>{client.phone}</Text>
            </View>
          ) : null}
          {!client.email && !client.phone ? (
            <View style={styles.cardRow}>
              <Text style={styles.cardEmpty}>No contact info</Text>
            </View>
          ) : null}
        </View>

        {client.notes ? (
          <>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.notesText}>{client.notes}</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* Measurement Sets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Measurement Sets</Text>
          <TouchableOpacity onPress={() => router.push(`/new-measurements/${id}`)}>
            <Text style={styles.addSetBtn}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {sets.length === 0 ? (
          <View style={styles.emptySet}>
            <Text style={styles.emptySetText}>No measurements saved yet.</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push(`/new-measurements/${id}`)}
            >
              <Text style={styles.buttonText}>Add Measurements</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            {sets.map((s, i) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.cardRow, i > 0 ? styles.cardRowBorder : null]}
                onPress={() => router.push(`/measurements/${s.id}`)}
                activeOpacity={0.6}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.setName}>{s.label}</Text>
                  <Text style={styles.setSub}>
                    {s.measure_mode === 'body' ? 'Body measurements' : 'Garment measurements'} · {s.unit === 'imperial' ? 'inches' : 'cm'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Danger zone */}
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteButtonText}>Delete Client</Text>
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
  headerSide: { width: 64 },
  headerSideRight: { alignItems: 'flex-end' },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: colors.warmWhite, textAlign: 'center', flex: 1, marginHorizontal: 8 },
  backBtn: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.lightGray },
  editBtn: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.lightGray },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, marginBottom: 10 },
  sectionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 28,
  },
  addSetBtn: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.charcoal, textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardRowBorder: { borderTopWidth: 1, borderTopColor: colors.rule },
  cardLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.charcoal, width: 72 },
  cardValue: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.offBlack, flex: 1 },
  cardEmpty: { fontFamily: fonts.sans, fontSize: 14, color: colors.lightGray },
  notesText: { fontFamily: fonts.sans, fontSize: 14, color: colors.charcoal, lineHeight: 22, flex: 1 },
  setName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.offBlack },
  setSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.warmGray, marginTop: 2 },
  chevron: { fontFamily: fonts.sans, fontSize: 22, color: colors.lightGray, marginLeft: 8 },
  emptySet: { alignItems: 'center', paddingVertical: 24 },
  emptySetText: { fontFamily: fonts.sans, fontSize: 14, color: colors.warmGray, marginBottom: 20 },
  button: { backgroundColor: colors.black, borderRadius: radius.sm, paddingVertical: 13, paddingHorizontal: 28, alignItems: 'center' },
  buttonText: { fontFamily: fonts.sansBold, color: colors.warmWhite, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  deleteButton: {
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#C8A8A8',
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
  },
  deleteButtonText: { fontFamily: fonts.sansBold, fontSize: 13, color: '#A05050', letterSpacing: 1, textTransform: 'uppercase' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.warmGray },
  bottomSpacer: { height: 40 },
})
