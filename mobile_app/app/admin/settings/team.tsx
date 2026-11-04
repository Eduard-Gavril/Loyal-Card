import { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { api } from '@/lib/supabase'
import { isPlanError, planErrorText } from '@/lib/plan'
import { useSettings } from '@/lib/settingsContext'
import { colors } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import FormGroup from '@/ui/FormGroup'
import Button from '@/ui/Button'
import Field from '@/ui/Field'
import PressableScale from '@/ui/PressableScale'
import Txt from '@/ui/Txt'

interface StaffAdmin {
  id: string
  email: string | null
  active: boolean
  created_at: string
}

/** Scan-only staff accounts and, where the store allows it, the broadcast notification. Owner only. */
export default function SettingsTeam() {
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin
  const { isOwner } = useSettings()

  const [staffList, setStaffList] = useState<StaffAdmin[]>([])
  const [staffListLoading, setStaffListLoading] = useState(false)
  const [staffEmail, setStaffEmail] = useState('')
  const [staffPassword, setStaffPassword] = useState('')
  const [creatingStaff, setCreatingStaff] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null)

  // Broadcast push notification, 1/day server-enforced limit
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcastError, setBroadcastError] = useState('')

  useEffect(() => { loadStaffList() }, [])

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
    Alert.alert(a.staffDeleteTitle, `${email ?? ''}\n${a.staffDeleteMsg}`, [
      { text: t.dashboard.cancel, style: 'cancel' },
      { text: a.staffDeleteBtn, style: 'destructive', onPress: () => handleDeleteStaff(staffId) },
    ])
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

  return (
    <ScreenScroll title={a.settingsStaff} bottomPad={48}>
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

      {/* Broadcast push notification.
          Hidden on iOS in the first release: App Store guideline 4.5.4 requires explicit in-app opt-in and opt-out for promotional pushes. */}
      {Platform.OS !== 'ios' && (
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
      )}
    </ScreenScroll>
  )
}

const s = StyleSheet.create({
  rowLoading: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
})
