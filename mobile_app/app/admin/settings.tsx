import { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { api, supabase } from '@/lib/supabase'
import { usePlanUsage, isPlanError, planErrorText } from '@/lib/plan'
import PlanCard from '@/components/PlanCard'
import { colors, continuous } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import Button from '@/ui/Button'
import Field from '@/ui/Field'
import PressableScale from '@/ui/PressableScale'
import Txt from '@/ui/Txt'

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

/** A padded block of fields, with a footnote header above it (same rhythm as a ListGroup). */
function FormGroup({ header, footer, children }: { header?: string; footer?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      {header ? (
        <Txt v="footnote" tone="secondary" style={s.groupHeader} accessibilityRole="header">
          {header.toUpperCase()}
        </Txt>
      ) : null}
      <View style={s.form}>{children}</View>
      {footer ? (
        <Txt v="footnote" tone="secondary" style={s.groupFooter}>
          {footer}
        </Txt>
      ) : null}
    </View>
  )
}

export default function AdminSettingsScreen() {
  const { tenantId, role } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin
  const isOwner = role === 'owner'
  const { usage: plan } = usePlanUsage(tenantId)
  const canLogo = !plan || plan.limits.can_white_label

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

  // Business deletion — owner only, 14 day grace period enforced by the database
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteName, setDeleteName] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleRequestDeletion() {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      const res = await api.requestTenantDeletion(deleteName)
      setDeletionScheduledAt(res?.scheduled_at ?? null)
      setShowDelete(false)
      setDeleteName('')
    } catch (e: any) {
      const msg = String(e?.message ?? '')
      setDeleteError(msg.includes('NAME_MISMATCH') ? a.deleteBizMismatch : msg || a.errorSaveMsg)
    } finally {
      setDeleteBusy(false)
    }
  }

  async function handleCancelDeletion() {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await api.cancelTenantDeletion()
      setDeletionScheduledAt(null)
    } catch (e: any) {
      setDeleteError(e?.message ?? a.errorSaveMsg)
    } finally {
      setDeleteBusy(false)
    }
  }

  useEffect(() => { loadSettings(); loadStaffList() }, [])

  async function handleSendBroadcast() {
    setSendingBroadcast(true)
    setBroadcastError('')
    try {
      const result: any = await api.sendBroadcastNotification(broadcastTitle.trim(), broadcastBody.trim())
      setBroadcastTitle('')
      setBroadcastBody('')
      Alert.alert(a.saved, a.broadcastSentMsg(result?.recipient_count ?? 0))
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
      setStaffError(isPlanError(e) ? planErrorText(e) : e?.message ?? 'Failed to create staff account')
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
        .select('name, logo_url, brand_color, metadata, active, deletion_scheduled_at')
        .eq('id', tenantId)
        .single()
      if (error) throw error
      if (data) {
        const meta = (data.metadata as Record<string, any>) ?? {}
        setRawMetadata(meta)
        setDeletionScheduledAt((data as any).deletion_scheduled_at ?? null)
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
      Alert.alert('Error', isPlanError(e) ? planErrorText(e) : e?.message ?? a.errorSaveMsg)
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
      Alert.alert(a.saved, a.savedMsg)
    } catch (e: any) {
      Alert.alert('Error', isPlanError(e) ? planErrorText(e) : e?.message ?? a.errorSaveMsg)
    } finally {
      setSaving(false)
    }
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={a.save}
              onPress={handleSave}
              disabled={!isDirty || saving}
              haptic="light"
              hitSlop={8}
              style={[s.saveBtn, (!isDirty || saving) && { opacity: 0.4 }]}
            >
              {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Txt v="headline" tone="tint">{a.save}</Txt>}
            </PressableScale>
          ),
        }}
      />
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Txt v="subhead" tone="secondary">
            {t.loading}
          </Txt>
        </View>
      ) : (
        <ScreenScroll title={a.settings} bottomPad={48}>
          {plan && <PlanCard usage={plan} />}

          {/* Branding */}
          <FormGroup header={a.brandingTitle}>
            <Field label={a.shopNameLabel} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Nome del negozio" />
            <View style={{ gap: 6 }}>
              <Field
                label={a.logoUrlLabel}
                value={form.logo_url}
                editable={canLogo}
                onChangeText={(v) => setForm((f) => ({ ...f, logo_url: v }))}
                placeholder="https://..."
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={!canLogo ? { opacity: 0.5 } : undefined}
              />
              {!canLogo && (
                <Txt v="footnote" tone="tint" style={{ marginLeft: 4 }}>
                  {a.planLogoLocked}
                </Txt>
              )}
            </View>
            <View style={{ gap: 8 }}>
              <Txt v="footnote" tone="secondary" style={{ marginLeft: 4 }}>
                {a.primaryColorLabel}
              </Txt>
              <View style={s.colorRow}>
                {PRESET_COLORS.map((c) => {
                  const selected = form.brand_color === c
                  return (
                    <PressableScale
                      key={c}
                      accessibilityRole="button"
                      accessibilityLabel={c}
                      accessibilityState={{ selected }}
                      haptic="selection"
                      onPress={() => setForm((f) => ({ ...f, brand_color: c }))}
                      hitSlop={4}
                      style={[s.colorDot, { backgroundColor: c }, selected && s.colorDotActive]}
                    >
                      {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </PressableScale>
                  )
                })}
              </View>
            </View>
            <Field value={form.brand_color} onChangeText={(v) => setForm((f) => ({ ...f, brand_color: v }))} placeholder="#7c3aed" autoCapitalize="none" autoCorrect={false} accessibilityLabel={a.primaryColorLabel} />
          </FormGroup>

          {/* Welcome message */}
          <FormGroup header={a.welcomeMsgTitle}>
            <Field value={form.welcome_message} onChangeText={(v) => setForm((f) => ({ ...f, welcome_message: v }))} placeholder={a.welcomeMsgPlaceholder} multiline accessibilityLabel={a.welcomeMsgTitle} />
          </FormGroup>

          {/* Status */}
          <ListGroup header={a.shopStatusTitle} footer={form.active ? a.shopVisibleLabel : a.shopHiddenLabel}>
            <ListRow icon="storefront-outline" title={a.shopActiveLabel} switchValue={form.active} onSwitchChange={(v) => setForm((f) => ({ ...f, active: v }))} />
          </ListGroup>

          {/* Staff accounts: owner only (staff can't reach this screen anyway, the role check stays as defense-in-depth) */}
          {isOwner && (
            <>
              <ListGroup header={a.staffTitle} footer={a.staffDesc}>
                {staffListLoading ? (
                  <View style={s.rowLoading}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : staffList.length === 0 ? (
                  <ListRow title={a.staffEmpty} />
                ) : (
                  staffList.map((staff) => (
                    <ListRow
                      key={staff.id}
                      icon="person-outline"
                      title={staff.email ?? ''}
                      subtitle={new Date(staff.created_at).toLocaleDateString()}
                      right={
                        <PressableScale
                          accessibilityRole="button"
                          accessibilityLabel={a.staffDeleteBtn}
                          onPress={() => confirmDeleteStaff(staff.id, staff.email)}
                          disabled={deletingStaffId === staff.id}
                          hitSlop={6}
                          style={s.iconBtn}
                        >
                          {deletingStaffId === staff.id ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="trash-outline" size={20} color={colors.danger} />}
                        </PressableScale>
                      }
                    />
                  ))
                )}
              </ListGroup>

              <FormGroup header={a.staffCreateBtn}>
                <Field label={a.staffEmailLabel} value={staffEmail} onChangeText={setStaffEmail} placeholder="staff@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
                <Field label={a.staffPasswordLabel} value={staffPassword} onChangeText={setStaffPassword} placeholder="••••••••" secureTextEntry />
                {staffError ? (
                  <Txt v="footnote" tone="danger">
                    {staffError}
                  </Txt>
                ) : null}
                <Button
                  variant="tinted"
                  icon="person-add-outline"
                  title={creatingStaff ? a.staffCreating : a.staffCreateBtn}
                  loading={creatingStaff}
                  disabled={!staffEmail.trim() || !staffPassword}
                  onPress={handleCreateStaff}
                />
              </FormGroup>

              {/* Broadcast push notification */}
              <FormGroup header={a.broadcastTitle} footer={`${a.broadcastDesc} ${a.broadcastLimitHint}.`}>
                <Field label={a.broadcastTitleLabel} value={broadcastTitle} onChangeText={setBroadcastTitle} placeholder={a.broadcastTitlePlaceholder} maxLength={60} />
                <Field label={a.broadcastBodyLabel} value={broadcastBody} onChangeText={setBroadcastBody} placeholder={a.broadcastBodyPlaceholder} multiline maxLength={150} />
                {broadcastError ? (
                  <Txt v="footnote" tone="danger">
                    {broadcastError}
                  </Txt>
                ) : null}
                <Button
                  variant="tinted"
                  icon="send-outline"
                  title={sendingBroadcast ? a.broadcastSending : a.broadcastSendBtn}
                  loading={sendingBroadcast}
                  disabled={!broadcastTitle.trim() || !broadcastBody.trim()}
                  onPress={handleSendBroadcast}
                />
              </FormGroup>

              {/* Delete business */}
              <FormGroup header={a.deleteBizTitle} footer={deletionScheduledAt ? undefined : a.deleteBizDesc}>
                {deletionScheduledAt ? (
                  <>
                    <Txt v="body">{a.deleteBizScheduled(new Date(deletionScheduledAt).toLocaleDateString())}</Txt>
                    <Button variant="tinted" icon="arrow-undo-outline" title={a.deleteBizCancelBtn} loading={deleteBusy} onPress={handleCancelDeletion} />
                  </>
                ) : !showDelete ? (
                  <Button variant="destructive" icon="trash-outline" title={a.deleteBizBtn} onPress={() => setShowDelete(true)} />
                ) : (
                  <>
                    <Field
                      label={a.deleteBizConfirmLabel(form.name)}
                      value={deleteName}
                      onChangeText={setDeleteName}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Button
                      variant="destructive"
                      icon="trash-outline"
                      title={a.deleteBizConfirmBtn}
                      loading={deleteBusy}
                      disabled={!deleteName.trim()}
                      onPress={handleRequestDeletion}
                    />
                    <Button variant="plain" title={t.dashboard.cancel} onPress={() => { setShowDelete(false); setDeleteName(''); setDeleteError('') }} />
                  </>
                )}
                {deleteError ? (
                  <Txt v="footnote" tone="danger">
                    {deleteError}
                  </Txt>
                ) : null}
              </FormGroup>
            </>
          )}

          {/* Preview */}
          <View style={{ marginBottom: 8 }}>
            <Txt v="footnote" tone="secondary" style={s.groupHeader}>
              {a.previewTitle.toUpperCase()}
            </Txt>
            <View style={[s.preview, { borderColor: form.brand_color + '55' }]}>
              <View style={[s.previewBadge, { backgroundColor: form.brand_color + '33' }]}>
                <Txt v="title3" style={{ color: form.brand_color }}>
                  {form.name.charAt(0).toUpperCase() || '?'}
                </Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="headline" numberOfLines={1}>
                  {form.name || 'Nome negozio'}
                </Txt>
                {form.welcome_message ? (
                  <Txt v="footnote" tone="secondary" numberOfLines={2}>
                    {form.welcome_message}
                  </Txt>
                ) : null}
              </View>
              <View style={[s.previewDot, { backgroundColor: form.active ? colors.success : colors.labelTertiary }]} />
            </View>
          </View>
        </ScreenScroll>
      )}
    </>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  saveBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  groupHeader: { marginLeft: 16, marginBottom: 6 },
  groupFooter: { marginHorizontal: 16, marginTop: 8 },
  form: { gap: 14, padding: 16, borderRadius: 22, backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...continuous },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 4 },
  colorDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  rowLoading: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, backgroundColor: colors.grouped, ...continuous },
  previewBadge: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...continuous },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
})
