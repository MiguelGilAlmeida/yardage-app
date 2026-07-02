import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../lib/store'
import { colors, fonts, radius } from '../../lib/theme'

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  created_at: string
}

export default function ClientsScreen() {
  const { session } = useAuthStore()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone, created_at')
      .order('name', { ascending: true })
    if (!error && data) setClients(data)
    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      if (session) fetchClients()
    }, [session])
  )

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>Cloth & Chalk</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.centerTitle}>Client Profiles</Text>
          <Text style={styles.centerBody}>
            Sign in to save client measurements and calculations.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>Create an account</Text>
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
        <TouchableOpacity
          style={[styles.headerSide, styles.headerSideRight]}
          onPress={() => router.push('/new-client')}
        >
          <Text style={styles.newBtn}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={colors.offBlack} />
        </View>
      ) : clients.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.centerTitle}>No clients yet</Text>
          <Text style={styles.centerBody}>
            Add your first client to start saving measurements.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/new-client')}>
            <Text style={styles.buttonText}>Add Client</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.clientRow}
              onPress={() => router.push(`/client/${item.id}`)}
              activeOpacity={0.6}
            >
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{item.name}</Text>
                {item.email ? (
                  <Text style={styles.clientSub}>{item.email}</Text>
                ) : item.phone ? (
                  <Text style={styles.clientSub}>{item.phone}</Text>
                ) : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
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
  headerSideRight: { alignItems: 'flex-end' },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: colors.warmWhite, textAlign: 'center' },
  newBtn: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.lightGray, textTransform: 'uppercase', letterSpacing: 1 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  centerTitle: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.black, marginBottom: 12, textAlign: 'center' },
  centerBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.warmGray, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  button: { backgroundColor: colors.black, borderRadius: radius.sm, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center', marginBottom: 16 },
  buttonText: { fontFamily: fonts.sansBold, color: colors.warmWhite, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  link: { alignItems: 'center' },
  linkText: { fontFamily: fonts.sans, color: colors.warmGray, fontSize: 13 },
  list: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40 },
  separator: { height: 1, backgroundColor: colors.rule, marginLeft: 16 },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warmWhite,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: radius.sm,
  },
  clientInfo: { flex: 1 },
  clientName: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.offBlack },
  clientSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.warmGray, marginTop: 3 },
  chevron: { fontFamily: fonts.sans, fontSize: 22, color: colors.lightGray, marginLeft: 12 },
})
