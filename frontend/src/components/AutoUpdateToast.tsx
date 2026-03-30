import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Auto-Update Service Worker Registration
 * Strategia: Auto-update senza interazione utente
 * 
 * Come funziona:
 * 1. Service worker controlla aggiornamenti ogni ora
 * 2. Quando c'è una nuova versione, si installa automaticamente in background
 * 3. Alla prossima navigazione/reload, la nuova versione è attiva
 * 
 * Vantaggi:
 * - Zero click richiesto dall'utente
 * - Aggiornamento seamless
 * - Non interrompe operazioni in corso
 * - localStorage persiste (stampini al sicuro)
 */
export function AutoUpdateToast() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
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
    // Con autoUpdate, questo viene chiamato quando c'è una nuova versione
    // Ma l'update avviene automaticamente in background
    onNeedRefresh() {
      console.log('🎉 New version detected! Updating automatically in background...')
      console.log('✓ Your stamps and data are safe in localStorage')
    },
  })

  // Log quando l'app diventa disponibile offline (senza mostrare toast)
  useEffect(() => {
    if (offlineReady) {
      console.log('✅ App ready for offline use')
    }
  }, [offlineReady])

  // Log needRefresh
  useEffect(() => {
    if (needRefresh) {
      console.log('ℹ️ needRefresh triggered with autoUpdate mode')
    }
  }, [needRefresh])

  // Non renderizza nulla (solo registrazione SW in background)
  return null
}
