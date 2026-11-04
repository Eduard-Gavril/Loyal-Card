import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { api, supabase } from '@/lib/supabase'
import { useSettings } from '@/lib/settingsContext'
import { ScreenScroll } from '@/ui/Screen'
import FormGroup from '@/ui/FormGroup'
import Button from '@/ui/Button'
import Field from '@/ui/Field'
import Txt from '@/ui/Txt'

/** Deleting the business (owner only): 14 day grace period enforced by the database, or immediate deletion with the password. */
export default function SettingsDanger() {
  const router = useRouter()
  const { clearAuth } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin
  const { form, deletionScheduledAt, setDeletionScheduledAt } = useSettings()

  const [showDelete, setShowDelete] = useState(false)
  const [deleteName, setDeleteName] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showForce, setShowForce] = useState(false)
  const [forcePassword, setForcePassword] = useState('')

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

  // Skips the grace period: deletes everything now and sends the owner back to the public home
  async function handleForceDeletion() {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await api.deleteTenantNow(forcePassword)
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      clearAuth()
      router.replace('/(tabs)/partners')
    } catch (e: any) {
      const msg = String(e?.message ?? '')
      setDeleteError(msg.includes('WRONG_PASSWORD') ? a.wrongPassword : msg || a.errorSaveMsg)
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

  return (
    <ScreenScroll title={a.deleteBizTitle} bottomPad={48}>
      <FormGroup header={a.deleteBizTitle} footer={deletionScheduledAt ? undefined : a.deleteBizDesc}>
        {deletionScheduledAt ? (
          <>
            <Txt v="body">{a.deleteBizScheduled(new Date(deletionScheduledAt).toLocaleDateString())}</Txt>
            <Button variant="tinted" icon="arrow-undo-outline" title={a.deleteBizCancelBtn} loading={deleteBusy} onPress={handleCancelDeletion} />
            {!showForce ? (
              <Button variant="destructive" icon="flame-outline" title={a.forceDeleteBtn} onPress={() => setShowForce(true)} />
            ) : (
              <>
                <Txt v="footnote" tone="danger">
                  {a.forceDeleteWarning}
                </Txt>
                <Field
                  label={a.forceDeletePasswordLabel}
                  value={forcePassword}
                  onChangeText={setForcePassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  variant="destructive"
                  icon="trash-outline"
                  title={a.forceDeleteConfirmBtn}
                  loading={deleteBusy}
                  disabled={!forcePassword}
                  onPress={handleForceDeletion}
                />
                <Button variant="plain" title={t.dashboard.cancel} onPress={() => { setShowForce(false); setForcePassword(''); setDeleteError('') }} />
              </>
            )}
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
    </ScreenScroll>
  )
}
