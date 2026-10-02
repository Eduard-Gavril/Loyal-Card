import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useClientStore } from '@/store'

/**
 * Auto-Update Service Worker Registration
 * Strategia: Auto-update senza interazione utente
 *
 * Come funziona:
 * 1. Service worker controlla aggiornamenti ogni ora
 * 2. Quando c'è una nuova versione, si installa automaticamente in background
 * 3. La pagina si ricarica da sola subito dopo (nessun refresh manuale, nessun
 *    "clear cookie" richiesto — localStorage/stampini restano intatti)
 *
 * Vantaggi:
 * - Zero click richiesto dall'utente
 * - Aggiornamento seamless
 * - localStorage persiste (stampini al sicuro)
 */
const RELOAD_MESSAGES: Record<string, string> = {
  en: 'Update available, reloading...',
  ro: 'Actualizare disponibilă, se reîncarcă...',
  it: 'Aggiornamento disponibile, ricarico...',
}

export function AutoUpdateToast() {
  const [reloading, setReloading] = useState(false)
  const { language } = useClientStore()

  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swScriptUrl, registration) {
      console.log('✅ Service Worker registered:', swScriptUrl)

      // Controlla aggiornamenti ogni ora
      registration && setInterval(() => {
        console.log('🔍 Checking for app updates...')
        registration.update()
      }, 60 * 60 * 1000) // 1 ora
    },
    onRegisterError(error: unknown) {
      console.error('❌ Service Worker registration error:', error)
    },
    onNeedRefresh() {
      console.log('🎉 New version detected! Reloading automatically...')
    },
  })

  // Log quando l'app diventa disponibile offline (senza mostrare toast)
  useEffect(() => {
    if (offlineReady) {
      console.log('✅ App ready for offline use')
    }
  }, [offlineReady])

  // Appena il nuovo service worker è pronto, lo attiva e ricarica la pagina da
  // sola. Senza questo, il nuovo SW resta installato ma inattivo finché
  // l'utente non ricarica manualmente — da qui nasceva l'abitudine (sbagliata,
  // e che cancella pure il client_id salvato) di dover "pulire i cookie" per
  // vedere gli aggiornamenti.
  useEffect(() => {
    if (needRefresh && !reloading) {
      setReloading(true)
      const timer = setTimeout(() => {
        updateServiceWorker(true)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [needRefresh, reloading, updateServiceWorker])

  if (!reloading) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm font-medium rounded-full shadow-2xl border border-white/20 flex items-center gap-2 animate-fadeIn">
      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      {RELOAD_MESSAGES[language] || RELOAD_MESSAGES.en}
    </div>
  )
}
