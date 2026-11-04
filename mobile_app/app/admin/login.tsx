import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { colors, continuous } from '@/theme'
import AmbientBackground from '@/components/AmbientBackground'
import Button from '@/ui/Button'
import Field from '@/ui/Field'
import PressableScale from '@/ui/PressableScale'
import Txt from '@/ui/Txt'

// Flip to true when business signup is open on the website (see frontend VITE_SIGNUP_OPEN)
const SIGNUP_OPEN = false

export default function AdminLoginScreen() {
  const router = useRouter()
  const { setAuth } = useAdminStore()
  const { language } = useClientStore()
  const a = getTranslation(language).admin

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError(a.loginMissing); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
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
        throw new Error(a.loginNoAdmin)
      }

      setAuth(data.user, data.session, admin.tenant_id ?? null, admin.role ?? 'staff')
      router.replace('/admin/dashboard')
    } catch (e: any) {
      setError(e?.message ?? a.loginInvalid)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AmbientBackground />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.icon}>
          <Ionicons name="shield-checkmark" size={34} color={colors.onPrimary} />
        </View>
        <Txt v="title1" style={s.center} accessibilityRole="header">
          {a.loginTitle}
        </Txt>
        <Txt v="subhead" tone="secondary" style={[s.center, { marginBottom: 28 }]}>
          {a.loginSubtitle}
        </Txt>

        <View style={{ gap: 14, alignSelf: 'stretch' }}>
          <Field
            label="Email"
            placeholder="Email"
            value={email}
            onChangeText={(v) => { setEmail(v); setError('') }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            placeholder="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); setError('') }}
            secureTextEntry={!showPass}
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            accessory={
              <PressableScale accessibilityRole="button" accessibilityLabel={showPass ? a.hidePassword : a.showPassword} onPress={() => setShowPass(!showPass)} hitSlop={6} style={s.eye}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.labelSecondary} />
              </PressableScale>
            }
          />
          {error ? (
            <View style={s.errorLine} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Txt v="footnote" tone="danger" style={{ flex: 1 }}>
                {error}
              </Txt>
            </View>
          ) : null}
          <Button title={a.loginBtn} loading={loading} onPress={handleLogin} style={{ marginTop: 6 }} />
          {SIGNUP_OPEN && (
            <Button
              variant="plain"
              title={language === 'it' ? 'Registra la tua attività sul sito' : language === 'ro' ? 'Înregistrează-ți afacerea pe site' : 'Register your business on the website'}
              onPress={() => Linking.openURL('https://loyalcard.net/register')}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32, gap: 4 },
  icon: { alignSelf: 'center', width: 76, height: 76, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...continuous },
  center: { textAlign: 'center' },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  errorLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
})
