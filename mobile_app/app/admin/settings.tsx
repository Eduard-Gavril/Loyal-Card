import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

interface TenantSettings {
  name: string
  logo_url: string
  brand_color: string
  welcome_message: string
  active: boolean
}

const PRESET_COLORS = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#2563eb', '#4f46e5']

export default function AdminSettingsScreen() {
  const colors = useTheme()
  const s = themedStyles(colors)
  const router = useRouter()
  const { tenantId } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<TenantSettings>({
    name: '',
    logo_url: '',
    brand_color: '#7c3aed',
    welcome_message: '',
    active: true,
  })
  const [originalForm, setOriginalForm] = useState<TenantSettings | null>(null)
  const [rawMetadata, setRawMetadata] = useState<Record<string, any>>({})

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('name, logo_url, brand_color, metadata, active')
        .eq('id', tenantId)
        .single()
      if (error) throw error
      if (data) {
        const meta = (data.metadata as Record<string, any>) ?? {}
        setRawMetadata(meta)
        const loaded: TenantSettings = {
          name: data.name ?? '',
          logo_url: data.logo_url ?? '',
          brand_color: data.brand_color ?? '#7c3aed',
          welcome_message: meta.welcome_message ?? '',
          active: data.active ?? true,
        }
        setForm(loaded)
        setOriginalForm(loaded)
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? a.errorSaveMsg)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!tenantId) return
    if (!form.name.trim()) { Alert.alert('Error', a.shopNameLabel); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: form.name.trim(),
          logo_url: form.logo_url.trim() || null,
          brand_color: form.brand_color,
          metadata: { ...rawMetadata, welcome_message: form.welcome_message.trim() || null },
          active: form.active,
        })
        .eq('id', tenantId)
      if (error) throw error
      setOriginalForm({ ...form })
      Alert.alert(`✅ ${a.saved}`, a.savedMsg)
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? a.errorSaveMsg)
    } finally {
      setSaving(false)
    }
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.admin.settings}</Text>
        <TouchableOpacity
          style={[s.saveBtn, (!isDirty || saving) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isDirty || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.saveBtnText}>{a.save}</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
          {/* Branding */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="storefront-outline" size={16} color={colors.primary} />
              <Text style={s.cardTitle}>{a.brandingTitle}</Text>
            </View>

            <Text style={s.fieldLabel}>{a.shopNameLabel}</Text>
            <TextInput
              style={s.input}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Nome del negozio"
              placeholderTextColor={colors.inkFaint}
            />

            <Text style={s.fieldLabel}>{a.logoUrlLabel}</Text>
            <TextInput
              style={s.input}
              value={form.logo_url}
              onChangeText={(v) => setForm((f) => ({ ...f, logo_url: v }))}
              placeholder="https://..."
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={s.fieldLabel}>{a.primaryColorLabel}</Text>
            <View style={s.colorRow}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.colorDot, { backgroundColor: c }, form.brand_color === c && s.colorDotActive]}
                  onPress={() => setForm((f) => ({ ...f, brand_color: c }))}
                >
                  {form.brand_color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[s.input, { marginTop: 8 }]}
              value={form.brand_color}
              onChangeText={(v) => setForm((f) => ({ ...f, brand_color: v }))}
              placeholder="#7c3aed"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
            />
          </View>

          {/* Messaggio */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
              <Text style={s.cardTitle}>{a.welcomeMsgTitle}</Text>
            </View>
            <TextInput
              style={[s.input, s.inputMultiline]}
              value={form.welcome_message}
              onChangeText={(v) => setForm((f) => ({ ...f, welcome_message: v }))}
              placeholder={a.welcomeMsgPlaceholder}
              placeholderTextColor={colors.inkFaint}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Status */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="toggle-outline" size={16} color={colors.primary} />
              <Text style={s.cardTitle}>{a.shopStatusTitle}</Text>
            </View>
            <View style={s.switchRow}>
              <View>
                <Text style={s.switchLabel}>{a.shopActiveLabel}</Text>
                <Text style={s.switchDesc}>
                  {form.active ? a.shopVisibleLabel : a.shopHiddenLabel}
                </Text>
              </View>
              <Switch
                value={form.active}
                onValueChange={(v) => setForm((f) => ({ ...f, active: v }))}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Preview */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="eye-outline" size={16} color={colors.primary} />
              <Text style={s.cardTitle}>{a.previewTitle}</Text>
            </View>
            <View style={[s.preview, { borderColor: form.brand_color + '55' }]}>
              <View style={[s.previewBadge, { backgroundColor: form.brand_color + '1E' }]}>
                <Text style={[s.previewInitial, { color: form.brand_color }]}>
                  {form.name.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.previewName}>{form.name || 'Nome negozio'}</Text>
                {form.welcome_message ? (
                  <Text style={s.previewMsg} numberOfLines={2}>{form.welcome_message}</Text>
                ) : null}
              </View>
              <View style={[s.previewDot, { backgroundColor: form.active ? colors.success : colors.inkFaint }]} />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const themedStyles = createThemedStyles((colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 80 },
  backText: { color: colors.ink, fontSize: 15, fontWeight: '500' },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm,
    minWidth: 60, alignItems: 'center',
    ...shadows.primaryBtn,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.inkSoft, fontSize: 14 },
  body: { padding: 20, gap: 16, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 16, gap: 4,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  fieldLabel: {
    color: colors.inkSoft, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 10, marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgDeep,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    color: colors.ink, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 8 },
  colorDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: colors.ink },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchLabel: { color: colors.ink, fontWeight: '600', fontSize: 15 },
  switchDesc: { color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: radius.md, padding: 14, marginTop: 4,
    backgroundColor: colors.bg,
  },
  previewBadge: {
    width: 48, height: 48, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  previewInitial: { fontSize: 24, fontWeight: '800' },
  previewName: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  previewMsg: { color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
}))
