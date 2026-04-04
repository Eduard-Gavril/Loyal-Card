import { useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import DarkVeil from '@/components/DarkVeil'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

export default function LandingPage() {
  const navigate = useNavigate()
  const { language, setLanguage } = useClientStore()
  const t = getTranslation(language)
  const containerRef = useRef<HTMLDivElement>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Update meta tags based on language
  useEffect(() => {
    const metaTags = {
      en: {
        title: 'LoyalCard - Digital Loyalty Card | Free Customer Rewards Program',
        description: 'Free digital loyalty card platform for businesses. Create mobile loyalty programs, reward customers, and boost retention. No setup fees. Start in 2 minutes!',
        keywords: 'digital loyalty card, customer rewards app, free loyalty program, digital punch card, mobile loyalty card'
      },
      ro: {
        title: 'LoyalCard - Card de Fidelitate Digital | Program Loialitate Gratuit',
        description: 'Platformă gratuită de carduri de fidelitate digitale pentru afaceri. Creează programe de loialitate mobile, recompensează clienții și crește retenția. Fără costuri!',
        keywords: 'card de fidelitate digital, aplicație recompense clienți, program loialitate gratuit, card digital puncte, card loialitate mobil'
      }
    }

    const meta = metaTags[language as keyof typeof metaTags] || metaTags.en
    
    document.title = meta.title
    
    const updateMetaTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute('name', name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }
    
    updateMetaTag('description', meta.description)
    updateMetaTag('keywords', meta.keywords)
    
    // Update html lang attribute
    document.documentElement.lang = language
  }, [language])

  // Funzione per chiudere il menu con animazione
  const closeMenu = () => {
    setMenuClosing(true)
    setTimeout(() => {
      setMenuOpen(false)
      setMenuClosing(false)
    }, 300) // Durata animazione
  }

  // Chiudi il menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="landing-page-container relative w-full min-h-screen overflow-y-auto overflow-x-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>

      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      {/* Menu Slide-in Drawer - Moved outside z-20 wrapper */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
              menuClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={closeMenu}
          ></div>

          {/* Drawer */}
          <div 
            ref={menuRef}
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-out flex flex-col"
            style={{ animation: menuClosing ? 'slideOutRight 0.3s ease-out' : 'slideInRight 0.3s ease-out' }}
          >
            {/* Header del Menu */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{t.menu.title}</h2>
              <button
                onClick={closeMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <button
                onClick={() => {
                  closeMenu()
                  setTimeout(scrollToTop, 300)
                }}
                className="w-full px-6 py-4 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-lg">{t.menu.home}</span>
              </button>

              <button
                onClick={() => {
                  closeMenu()
                  setTimeout(() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                  }, 300)
                }}
                className="w-full px-6 py-4 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg">{t.menu.howItWorks}</span>
              </button>

              <button
                onClick={() => {
                  closeMenu()
                  setTimeout(() => {
                    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })
                  }, 300)
                }}
                className="w-full px-6 py-4 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg">{t.menu.faq}</span>
              </button>

              <button
                onClick={() => {
                  closeMenu()
                  setTimeout(() => {
                    document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })
                  }, 300)
                }}
                className="w-full px-6 py-4 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-lg">{t.menu.footer}</span>
              </button>
            </nav>

            {/* Language Toggle - Spostato in basso per accessibilità mobile */}
            <div className="p-6 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                 Language / Limba
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    language === 'en'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🇬🇧 EN
                </button>
                <button
                  onClick={() => setLanguage('ro')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    language === 'ro'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🇷🇴 RO
                </button>
              </div>
            </div>

            {/* Admin Button - In fondo */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  closeMenu()
                  setTimeout(() => navigate('/admin/login'), 300)
                }}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-3 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t.menu.admin}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-6 sm:pt-8 pl-0 pr-4 sm:px-6">
          <div className="max-w-6xl sm:mx-auto flex justify-between items-center">
            <div className="flex items-center gap-0 -ml-1">
              <img src="/logo.png" alt="Logo" className="h-16 sm:h-20 w-auto -mr-6 sm:-mr-8" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {t.appName}
              </h1>
            </div>
            
            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-2 sm:py-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              {t.hero.title}
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
            </h2>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-base sm:text-lg font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-600/60 hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  {t.hero.getCard}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>

              <button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white text-base sm:text-lg font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                {t.hero.learnMore}
              </button>
            </div>
          </div>
        </main>

        {/* Stats */}
        <div className="pb-6 sm:pb-8 md:pb-10 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 text-center">
            <div className="p-3 sm:p-4 md:p-6 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">100%</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-300">{t.stats.digital}</div>
            </div>
            <div className="p-3 sm:p-4 md:p-6 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">∞</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-300">{t.stats.rewards}</div>
            </div>
            <div className="p-3 sm:p-4 md:p-6 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">0€</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-300">{t.stats.cost}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section (scrollable) */}
      <section id="features" className="relative z-30 bg-white py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back to top button */}
          <button
            onClick={scrollToTop}
            className="mb-8 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {t.hero.backToTop}
          </button>

          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12 sm:mb-16">
            {t.features.title}
          </h3>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl">📱</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                {t.features.step1.title}
              </h4>
              <p className="text-sm sm:text-base text-gray-600">
                {t.features.step1.description}
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl">📸</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                {t.features.step2.title}
              </h4>
              <p className="text-sm sm:text-base text-gray-600">
                {t.features.step2.description}
              </p>
            </div>

            <div className="text-center sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl">🎁</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                {t.features.step3.title}
              </h4>
              <p className="text-sm sm:text-base text-gray-600">
                {t.features.step3.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="relative z-30 bg-gray-50 py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12 sm:mb-16">
            {t.forWho.title}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* For Businesses */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🏪</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">{t.forWho.businesses.title}</h4>
              <p className="text-gray-600 mb-6">{t.forWho.businesses.subtitle}</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t.forWho.businesses.benefit1}
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t.forWho.businesses.benefit2}
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t.forWho.businesses.benefit3}
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t.forWho.businesses.benefit4}
                </li>
              </ul>
            </div>

            {/* For Customers */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">👤</span>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">{t.forWho.customers.title}</h4>
              <p className="text-gray-600 mb-6">{t.forWho.customers.subtitle}</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t.forWho.customers.benefit1}
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t.forWho.customers.benefit2}
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t.forWho.customers.benefit3}
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t.forWho.customers.benefit4}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-30 bg-white py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12 sm:mb-16">
            {t.faq.title}
          </h3>
          
          <div className="space-y-4">
            {[
              { q: t.faq.q1, a: t.faq.a1 },
              { q: t.faq.q2, a: t.faq.a2 },
              { q: t.faq.q3, a: t.faq.a3 },
              { q: t.faq.q4, a: t.faq.a4 },
              { q: t.faq.q5, a: t.faq.a5 },
              { q: t.faq.q6, a: t.faq.a6 },
              { q: t.faq.q7, a: t.faq.a7 },
              { q: t.faq.q8, a: t.faq.a8 },
            ].map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-600">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="relative z-30 bg-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Brand */}
          <div className="text-center mb-12">
            <h4 className="text-2xl font-bold mb-4">LoyalCard</h4>
            <p className="text-gray-400">{t.footerNav.tagline}</p>
          </div>
          
          {/* Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Legal Links */}
            <div className="text-center md:text-left">
              <h5 className="font-semibold text-lg mb-4">{t.footerNav.legal}</h5>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t.footerNav.privacy}
                  </a>
                </li>
                <li>
                  <a
                    href="/cookie-policy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t.footerNav.cookies}
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Contact */}
            <div className="text-center">
              <h5 className="font-semibold text-lg mb-4">{t.footerNav.contact}</h5>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/contact"
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {t.footerNav.contactUs}
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Social Links */}
            <div className="text-center md:text-right">
              <h5 className="font-semibold text-lg mb-4">{t.footerNav.social}</h5>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://www.instagram.com/loyal.card/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 justify-center md:justify-end"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    {t.footerNav.instagram}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>{t.footerNav.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
