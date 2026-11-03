import { useEffect, useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useClientStore } from '@/store'

// Shown on the owner dashboard while the business waits for approval or is scheduled for deletion.
export default function TenantStatusBanner() {
  const { tenantId } = useAuthStore()
  const { language } = useClientStore()
  const [state, setState] = useState<{ pending: boolean; deletionAt: string | null }>({ pending: false, deletionAt: null })

  useEffect(() => {
    if (!tenantId) return
    let cancelled = false
    supabase
      .from('tenants')
      .select('approval_status, deletion_scheduled_at')
      .eq('id', tenantId)
      .single()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        setState({ pending: data.approval_status === 'pending', deletionAt: data.deletion_scheduled_at ?? null })
      })
    return () => { cancelled = true }
  }, [tenantId])

  if (!state.pending && !state.deletionAt) return null

  const L = (it: string, ro: string, en: string) => (language === 'it' ? it : language === 'ro' ? ro : en)
  const date = state.deletionAt ? new Date(state.deletionAt).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'ro' ? 'ro-RO' : 'en-GB') : ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 space-y-3">
      {state.pending && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/15 backdrop-blur-xl px-4 py-3 text-amber-100">
          <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">
            {L(
              'La tua richiesta è in attesa di approvazione. Intanto puoi configurare premi, prodotti e impostazioni: l\'attività non è ancora visibile ai clienti.',
              'Cererea ta așteaptă aprobarea. Între timp poți configura recompense, produse și setări: afacerea nu este încă vizibilă clienților.',
              'Your request is waiting for approval. Meanwhile you can set up rewards, products and settings: the business is not visible to customers yet.'
            )}
          </p>
        </div>
      )}
      {state.deletionAt && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/40 bg-red-500/15 backdrop-blur-xl px-4 py-3 text-red-100">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">
            {L(
              `L'attività verrà eliminata definitivamente il ${date}. Puoi annullare l'eliminazione da Impostazioni.`,
              `Afacerea va fi ștearsă definitiv pe ${date}. Poți anula ștergerea din Setări.`,
              `Your business will be permanently deleted on ${date}. You can cancel the deletion in Settings.`
            )}
          </p>
        </div>
      )}
    </div>
  )
}
