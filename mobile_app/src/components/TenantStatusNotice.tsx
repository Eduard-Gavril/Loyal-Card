import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAdminStore, useClientStore } from '@/store'
import { colors, continuous } from '@/theme'
import Txt from '@/ui/Txt'
import Button from '@/ui/Button'

/** Shown on the admin dashboard while the business waits for approval or is scheduled for deletion. */
export default function TenantStatusNotice() {
  const router = useRouter()
  const { tenantId } = useAdminStore()
  const { language } = useClientStore()
  const [pending, setPending] = useState(false)
  const [deletionAt, setDeletionAt] = useState<string | null>(null)
  const [noLocation, setNoLocation] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    supabase
      .from('tenants')
      .select('approval_status, deletion_scheduled_at, latitude, longitude')
      .eq('id', tenantId)
      .single()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        setPending(data.approval_status === 'pending')
        setDeletionAt(data.deletion_scheduled_at ?? null)
        setNoLocation(data.approval_status !== 'pending' && (data.latitude == null || data.longitude == null))
      })
    return () => { cancelled = true }
  }, [tenantId])

  if (!pending && !deletionAt && !noLocation) return null

  const L = (it: string, ro: string, en: string) => (language === 'it' ? it : language === 'ro' ? ro : en)
  const date = deletionAt ? new Date(deletionAt).toLocaleDateString() : ''

  return (
    <View style={{ gap: 10, marginBottom: 16 }}>
      {pending && (
        <View style={[s.box, { backgroundColor: colors.primarySoft }]} accessibilityRole="alert">
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Txt v="subhead" style={s.text}>
            {L(
              "La tua richiesta è in attesa di approvazione. Intanto puoi configurare premi, prodotti e impostazioni: l'attività non è ancora visibile ai clienti.",
              'Cererea ta așteaptă aprobarea. Între timp poți configura recompense, produse și setări: afacerea nu este încă vizibilă clienților.',
              'Your request is waiting for approval. Meanwhile you can set up rewards, products and settings: the business is not visible to customers yet.'
            )}
          </Txt>
        </View>
      )}
      {noLocation && (
        <View style={[s.box, { backgroundColor: colors.primarySoft, flexDirection: 'column' }]} accessibilityRole="alert">
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Txt v="subhead" style={s.text}>
              {L(
                'La tua attività non compare ancora nella lista dei partner: mancano indirizzo e posizione. Completali in Impostazioni.',
                'Afacerea ta nu apare încă în lista partenerilor: lipsesc adresa și locația. Completează-le în Setări.',
                'Your business does not appear in the partners list yet: address and location are missing. Complete them in Settings.'
              )}
            </Txt>
          </View>
          <Button
            variant="tinted"
            title={L('Apri Impostazioni', 'Deschide Setări', 'Open Settings')}
            onPress={() => router.push('/admin/settings')}
          />
        </View>
      )}
      {deletionAt && (
        <View style={[s.box, { backgroundColor: colors.dangerSoft }]} accessibilityRole="alert">
          <Ionicons name="warning-outline" size={20} color={colors.danger} />
          <Txt v="subhead" style={s.text}>
            {L(
              `L'attività verrà eliminata definitivamente il ${date}. Puoi annullare l'eliminazione dalle Impostazioni.`,
              `Afacerea va fi ștearsă definitiv pe ${date}. Poți anula ștergerea din Setări.`,
              `Your business will be permanently deleted on ${date}. You can cancel the deletion in Settings.`
            )}
          </Txt>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 18, ...continuous },
  text: { flex: 1 },
})
