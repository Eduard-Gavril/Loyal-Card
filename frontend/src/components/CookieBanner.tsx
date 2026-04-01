import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const navigate = useNavigate()
  const { language } = useClientStore()
  const t = getTranslation(language)

  useEffect(() => {
    const consent = localStorage.getItem('loyalcard-cookie-consent')
    if (!consent) {
      // Mostra banner dopo 1 secondo per non essere invasivo
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('loyalcard-cookie-consent', JSON.stringify({
      essential: true,
      analytics: true,
      timestamp: new Date().toISOString()
    }))
    setShowBanner(false)
  }

  const acceptEssential = () => {
    localStorage.setItem('loyalcard-cookie-consent', JSON.stringify({
      essential: true,
      analytics: false,
      timestamp: new Date().toISOString()
    }))
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm text-white p-4 sm:p-6 shadow-2xl z-[100] animate-slide-up">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-bold mb-2">{t.cookieBanner.title}</h3>
            <p className="text-xs sm:text-sm text-gray-300">
              {t.cookieBanner.description}{' '}
              <button
                onClick={() => navigate('/privacy')}
                className="underline hover:text-white"
              >
                {t.cookieBanner.privacyLink}
              </button>
              {' | '}
              <button
                onClick={() => navigate('/cookie-policy')}
                className="underline hover:text-white"
              >
                {t.cookieBanner.cookieLink}
              </button>
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={acceptEssential}
              className="flex-1 sm:flex-none bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              {t.cookieBanner.acceptEssential}
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              {t.cookieBanner.acceptAll}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
