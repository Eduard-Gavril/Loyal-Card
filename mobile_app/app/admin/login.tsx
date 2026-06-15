import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store'

export default function AdminLoginScreen() {
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
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={s.backText}>Indietro</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <View style={s.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#7c3aed" />
        </View>
        <Text style={s.title}>Admin Login</Text>
        <Text style={s.sub}>Accesso riservato agli amministratori</Text>

        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor="#4b5563"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <View style={s.passWrap}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Password"
              placeholderTextColor="#4b5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoComplete="password"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#f87171" />
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0d2e' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#fff', fontSize: 15 },
  body: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 8 },
  iconWrap: { alignItems: 'center', marginBottom: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  sub: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  form: { gap: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 0 },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingRight: 12 },
  eyeBtn: { padding: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' },
  errorText: { color: '#f87171', fontSize: 13, flex: 1 },
  loginBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
