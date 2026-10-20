import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import './CookieBanner.css'

// Pages already redesigned with the amber look. The banner follows the page it sits on;
// add a route here when its page is migrated.
const AMBER_ROUTES = ['/', '/dashboard', '/wallet', '/select-tenant', '/recovery', '/privacy', '/terms', '/cookie-policy', '/refund', '/acceptable-use', '/contact']
const AMBER_PREFIXES = ['/card', '/admin', '/super-admin']

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const amber = AMBER_ROUTES.includes(pathname) || AMBER_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

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

  const cls = amber
    ? {
        wrap: 'cb-amber',
        inner: 'cb-inner',
        title: 'cb-title',
        text: 'cb-text',
        link: 'cb-link',
        buttons: 'cb-buttons',
        essential: 'cb-btn cb-btn-ghost',
        all: 'cb-btn cb-btn-main',
      }
    : {
        wrap: 'fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm text-white p-4 sm:p-6 shadow-2xl z-[100] animate-slide-up',
        inner: 'max-w-6xl mx-auto',
        title: 'text-base sm:text-lg font-bold mb-2',
        text: 'text-xs sm:text-sm text-gray-300',
        link: 'underline hover:text-white',
        buttons: 'flex gap-2 sm:gap-3 w-full sm:w-auto',
        essential: 'flex-1 sm:flex-none bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium',
        all: 'flex-1 sm:flex-none bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium',
      }

  return (
    <div className={cls.wrap}>
      <div className={cls.inner}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className={cls.title}>{t.cookieBanner.title}</h3>
            <p className={cls.text}>
              {t.cookieBanner.description}{' '}
              <button
                onClick={() => navigate('/privacy')}
                className={cls.link}
              >
                {t.cookieBanner.privacyLink}
              </button>
              {' | '}
              <button
                onClick={() => navigate('/cookie-policy')}
                className={cls.link}
              >
                {t.cookieBanner.cookieLink}
              </button>
            </p>
          </div>
          <div className={cls.buttons}>
            <button
              onClick={acceptEssential}
              className={cls.essential}
            >
              {t.cookieBanner.acceptEssential}
            </button>
            <button
              onClick={acceptAll}
              className={cls.all}
            >
              {t.cookieBanner.acceptAll}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
