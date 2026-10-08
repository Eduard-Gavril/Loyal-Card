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
import { api, supabase } from '@/lib/supabase'
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

interface TenantSettings {
  name: string
  logo_url: string
  brand_color: string
  welcome_message: string
  active: boolean
}

interface StaffAdmin {
  id: string
  email: string | null
  active: boolean
  created_at: string
}

const PRESET_COLORS = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#2563eb', '#4f46e5']

export default function AdminSettingsScreen() {
  const colors = useTheme()
  const s = themedStyles(colors)
  const router = useRouter()
  const { tenantId, role } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin
  const isOwner = role === 'owner'

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

  // Staff (scan-only) account management — owner only
  const [staffList, setStaffList] = useState<StaffAdmin[]>([])
  const [staffListLoading, setStaffListLoading] = useState(false)
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [creatingStaff, setCreatingStaff] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null)

  // Broadcast push notification — owner only, 1/day server-enforced limit
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcastError, setBroadcastError] = useState('')

  useEffect(() => { loadSettings(); loadStaffList() }, [])

  async function handleSendBroadcast() {
    setSendingBroadcast(true)
    setBroadcastError('')
    try {
      const result: any = await api.sendBroadcastNotification(broadcastTitle.trim(), broadcastBody.trim())
      setBroadcastTitle('')
      setBroadcastBody('')
      Alert.alert(`✅ ${a.saved}`, a.broadcastSentMsg(result?.recipient_count ?? 0))
    } catch (e: any) {
      setBroadcastError(e?.message ?? a.errorSaveMsg)
    } finally {
      setSendingBroadcast(false)
    }
  }

  async function loadStaffList() {
    if (!isOwner) return
    setStaffListLoading(true)
    try {
      const result: any = await api.listStaffAdmins()
      setStaffList(result?.staff ?? [])
    } catch {
      // Non-fatal: the create form still works even if the list fails to load.
    } finally {
      setStaffListLoading(false)
    }
  }

  async function handleCreateStaff() {
    setCreatingStaff(true)
    setStaffError('')
    try {
      await api.createStaffAdmin(staffEmail.trim(), staffPassword)
      setStaffEmail('')
      setStaffPassword('')
      await loadStaffList()
    } catch (e: any) {
      setStaffError(e?.message ?? 'Failed to create staff account')
    } finally {
      setCreatingStaff(false)
    }
  }

  function confirmDeleteStaff(staffId: string, email: string | null) {
    Alert.alert(
      a.staffDeleteTitle,
      `${email ?? ''}\n${a.staffDeleteMsg}`,
      [
        { text: t.dashboard.cancel, style: 'cancel' },
        { text: a.staffDeleteBtn, style: 'destructive', onPress: () => handleDeleteStaff(staffId) },
      ]
    )
  }

  async function handleDeleteStaff(staffId: string) {
    setDeletingStaffId(staffId)
    try {
      await api.deleteStaffAdmin(staffId)
      setStaffList((prev) => prev.filter((s) => s.id !== staffId))
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to delete staff account')
    } finally {
      setDeletingStaffId(null)
    }
  }

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

          {/* Staff accounts — owner only (staff can't reach this screen anyway, but
              the role check stays here too, same defense-in-depth as the web app) */}
          {isOwner && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="people-outline" size={16} color={colors.primary} />
                <Text style={s.cardTitle}>{a.staffTitle}</Text>
              </View>
              <Text style={s.staffDesc}>{a.staffDesc}</Text>

              {staffListLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
              ) : staffList.length === 0 ? (
                <Text style={s.staffEmpty}>{a.staffEmpty}</Text>
              ) : (
                <View style={{ gap: 8, marginTop: 8, marginBottom: 4 }}>
                  {staffList.map((staff) => (
                    <View key={staff.id} style={s.staffRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.staffEmail}>{staff.email}</Text>
                        <Text style={s.staffDate}>
                          {new Date(staff.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={s.staffDeleteBtn}
                        onPress={() => confirmDeleteStaff(staff.id, staff.email)}
                        disabled={deletingStaffId === staff.id}
                      >
                        {deletingStaffId === staff.id
                          ? <ActivityIndicator size="small" color={colors.danger} />
                          : <Ionicons name="trash-outline" size={16} color={colors.danger} />}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={s.fieldLabel}>{a.staffEmailLabel}</Text>
              <TextInput
                style={s.input}
                value={staffEmail}
                onChangeText={setStaffEmail}
                placeholder="staff@example.com"
                placeholderTextColor={colors.inkFaint}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Text style={s.fieldLabel}>{a.staffPasswordLabel}</Text>
              <TextInput
                style={s.input}
                value={staffPassword}
                onChangeText={setStaffPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.inkFaint}
                secureTextEntry
              />
              {staffError ? <Text style={s.staffError}>{staffError}</Text> : null}
              <TouchableOpacity
                style={[s.staffCreateBtn, (creatingStaff || !staffEmail.trim() || !staffPassword) && s.saveBtnDisabled]}
                onPress={handleCreateStaff}
                disabled={creatingStaff || !staffEmail.trim() || !staffPassword}
              >
                {creatingStaff
                  ? <><ActivityIndicator size="small" color="#fff" /><Text style={s.staffCreateBtnText}>{a.staffCreating}</Text></>
                  : <><Ionicons name="person-add-outline" size={16} color="#fff" /><Text style={s.staffCreateBtnText}>{a.staffCreateBtn}</Text></>}
              </TouchableOpacity>
            </View>
          )}

          {/* Broadcast push notification — owner only */}
          {isOwner && (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="notifications-outline" size={16} color={colors.primary} />
                <Text style={s.cardTitle}>{a.broadcastTitle}</Text>
              </View>
              <Text style={s.staffDesc}>{a.broadcastDesc}</Text>

              <Text style={s.fieldLabel}>{a.broadcastTitleLabel}</Text>
              <TextInput
                style={s.input}
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
                placeholder={a.broadcastTitlePlaceholder}
                placeholderTextColor={colors.inkFaint}
                maxLength={60}
              />
              <Text style={s.fieldLabel}>{a.broadcastBodyLabel}</Text>
              <TextInput
                style={[s.input, s.inputMultiline]}
                value={broadcastBody}
                onChangeText={setBroadcastBody}
                placeholder={a.broadcastBodyPlaceholder}
                placeholderTextColor={colors.inkFaint}
                multiline
                numberOfLines={3}
                maxLength={150}
              />
              {broadcastError ? <Text style={s.staffError}>{broadcastError}</Text> : null}
              <TouchableOpacity
                style={[s.staffCreateBtn, (sendingBroadcast || !broadcastTitle.trim() || !broadcastBody.trim()) && s.saveBtnDisabled]}
                onPress={handleSendBroadcast}
                disabled={sendingBroadcast || !broadcastTitle.trim() || !broadcastBody.trim()}
              >
                {sendingBroadcast
                  ? <><ActivityIndicator size="small" color="#fff" /><Text style={s.staffCreateBtnText}>{a.broadcastSending}</Text></>
                  : <><Ionicons name="send-outline" size={16} color="#fff" /><Text style={s.staffCreateBtnText}>{a.broadcastSendBtn}</Text></>}
              </TouchableOpacity>
              <Text style={s.broadcastLimitHint}>{a.broadcastLimitHint}</Text>
            </View>
          )}

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

  staffDesc: { color: colors.inkSoft, fontSize: 12, lineHeight: 17, marginBottom: 4 },
  staffEmpty: { color: colors.inkFaint, fontSize: 13, marginVertical: 8 },
  staffRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgDeep, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  staffEmail: { color: colors.ink, fontWeight: '600', fontSize: 13.5 },
  staffDate: { color: colors.inkFaint, fontSize: 11, marginTop: 1 },
  staffDeleteBtn: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  staffError: { color: colors.danger, fontSize: 12, marginTop: 6 },
  staffCreateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 12, marginTop: 12,
    ...shadows.primaryBtn,
  },
  staffCreateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  broadcastLimitHint: { color: colors.inkFaint, fontSize: 11, marginTop: 8, textAlign: 'center' },
}))
