import { useEffect, useState } from 'react'

interface PWAInstallPromptProps {
  t: any
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt({ t }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  // Check if recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < oneWeek) {
        setShowPrompt(false)
      }
    }
  }, [])

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-4 shadow-2xl border border-primary-400/30">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">
              {t.client.card.installApp || 'Installa App'}
            </h3>
            <p className="text-white/70 text-xs mt-0.5">
              {t.client.card.installDescription || 'Aggiungi alla schermata home per un accesso rapido'}
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              ✕
            </button>
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-primary-600 font-semibold text-sm rounded-lg hover:bg-white/90 transition-all"
            >
              {t.client.card.install || 'Installa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
