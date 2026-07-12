import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store'
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

export default function AdminLoginScreen() {
  const colors = useTheme()
  const s = themedStyles(colors)
  const router = useRouter()
  const { setAuth } = useAdminStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError('Inserisci email e password'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      // Fetch role from admins table (same as web app)
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('role, tenant_id')
        .eq('user_id', data.user.id)
        .eq('active', true)
        .single()

      if (adminError || !admin) {
        await supabase.auth.signOut()
        throw new Error('Account admin non trovato o non attivo')
      }

      setAuth(data.user, data.session, admin.tenant_id ?? null, admin.role ?? 'staff')
      router.replace('/admin/dashboard')
    } catch (e: any) {
      setError(e?.message ?? 'Credenziali non valide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={s.backText}>Indietro</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <View style={s.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={40} color={colors.onNight} />
        </View>
        <Text style={s.title}>Admin Login</Text>
        <Text style={s.sub}>Accesso riservato agli amministratori</Text>

        <View style={s.formCard}>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor={colors.inkFaint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <View style={s.passWrap}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent' }]}
              placeholder="Password"
              placeholderTextColor={colors.inkFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoComplete="password"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkFaint} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.loginBtn, loading && s.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.loginBtnText}>Accedi</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const themedStyles = createThemedStyles((colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { color: colors.ink, fontSize: 15, fontWeight: '500' },
  body: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 8, paddingBottom: 60 },
  iconWrap: {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: colors.night,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 10,
    ...shadows.night,
  },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  sub: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', marginBottom: 24 },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: 18, gap: 12,
    ...shadows.card,
  },
  input: {
    backgroundColor: colors.bgDeep,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    color: colors.ink, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15,
  },
  passWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgDeep,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingRight: 12,
  },
  eyeBtn: { padding: 4 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.dangerSoft, borderRadius: radius.sm,
    padding: 12, borderWidth: 1, borderColor: colors.dangerBorder,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  loginBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
    ...shadows.primaryBtn,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
}))
