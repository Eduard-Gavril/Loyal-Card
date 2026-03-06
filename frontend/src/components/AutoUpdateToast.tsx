import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Auto-Update Toast
 * Strategia: Auto-update senza interazione utente
 * 
 * Come funziona:
 * 1. Service worker controlla aggiornamenti ogni ora
 * 2. Quando c'è una nuova versione, si installa automaticamente in background
 * 3. Alla prossima navigazione/reload, la nuova versione è attiva
 * 4. Mostra un toast quando l'app diventa disponibile offline
 * 
 * Vantaggi:
 * - Zero click richiesto dall'utente
 * - Aggiornamento seamless
 * - Non interrompe operazioni in corso
 * - localStorage persiste (stampini al sicuro)
 */
export function AutoUpdateToast() {
  const [showToast, setShowToast] = useState(false)
  
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

  // Mostra toast quando l'app diventa disponibile offline
  useEffect(() => {
    if (offlineReady) {
      setShowToast(true)
      // Auto-hide dopo 5 secondi
      setTimeout(() => setShowToast(false), 5000)
    }
  }, [offlineReady])

  // Con autoUpdate, needRefresh non dovrebbe attivarsi
  // Ma lo gestiamo comunque per logging
  useEffect(() => {
    if (needRefresh) {
      console.log('ℹ️ needRefresh triggered with autoUpdate mode')
    }
  }, [needRefresh])

  if (!showToast) return null

  return (
    <div 
      className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 
                 rounded-lg shadow-2xl z-50
                 flex items-center gap-3 animate-slide-up"
      role="status"
      aria-live="polite"
    >
      <div className="flex-shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <p className="font-semibold">✓ App pronta offline</p>
        <p className="text-xs opacity-90">I tuoi dati sono al sicuro</p>
      </div>
      <button
        onClick={() => setShowToast(false)}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Chiudi notifica"
      >
        ✕
      </button>
    </div>
  )
}
