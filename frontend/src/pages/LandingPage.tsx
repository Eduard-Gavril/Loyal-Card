import { useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

export default function LandingPage() {
  const navigate = useNavigate()
  const { language, setLanguage } = useClientStore()
  const t = getTranslation(language)
  const containerRef = useRef<HTMLDivElement>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [faqSectionOpen, setFaqSectionOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Touch gesture detection with smooth follow
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)
  const isDragging = useRef<boolean>(false)
  const [dragOffset, setDragOffset] = useState<number>(320) // 320 = fully closed, 0 = fully open

  // Force menu closed on mount
  useEffect(() => {
    setMenuOpen(false)
    setMenuClosing(false)
  }, [])

  // Swipe gesture handler: swipe from right edge to left opens menu smoothly
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
      touchStartTime.current = Date.now()
      
      // Check if starting from right edge (within 50px) AND not touching a button
      const target = e.target as HTMLElement
      const isButton = target.tagName === 'BUTTON' || target.closest('button')
      
      if (touch.clientX > window.innerWidth - 50 && !menuOpen && !isButton) {
        isDragging.current = true
        setDragOffset(320) // Start with menu fully closed (off-screen)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartX.current
      const deltaY = touch.clientY - touchStartY.current
      
      // Check if it's horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Show menu during drag
        if (!menuOpen) setMenuOpen(true)
        
        // Calculate offset: menu starts at 320px (off-screen) and moves to 0 (visible)
        // When swiping left (negative deltaX), reduce offset to slide menu in
        const offset = Math.max(0, Math.min(320, 320 + deltaX))
        setDragOffset(offset)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging.current) return
      
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartX.current
      const deltaTime = Date.now() - touchStartTime.current
      const velocity = Math.abs(deltaX) / deltaTime // px per ms
      
      isDragging.current = false
      
      // Threshold: if dragged menu in more than 40% or fast swipe, complete opening
      const threshold = 320 * 0.6 // If offset < 192px (menu is 40% visible), open it
      const shouldOpen = dragOffset < threshold || velocity > 0.5
      
      if (shouldOpen) {
        // Complete the opening - snap to fully open
        setDragOffset(0)
      } else {
        // Cancel and close - snap back out
        setMenuClosing(true)
        setDragOffset(320)
        setTimeout(() => {
          setMenuOpen(false)
          setMenuClosing(false)
        }, 300)
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [menuOpen, dragOffset])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Update meta tags based on language
  useEffect(() => {
    const metaTags = {
      en: {
        title: 'LoyalCard - Digital Loyalty Card | Free Customer Rewards Program',
        description: 'Free digital loyalty card platform for businesses. Create mobile loyalty programs, reward customers, and boost retention. No setup fees. Start in 2 minutes!',
        keywords: 'digital loyalty card, customer rewards app, free loyalty program, digital punch card, mobile loyalty card',
        canonical: 'https://loyalcard.net/'
      },
      it: {
        title: 'LoyalCard - Carta Fedeltà Digitale | Programma Fedeltà Gratuito',
        description: 'Piattaforma gratuita di carte fedeltà digitali per aziende. Crea programmi fedeltà mobile, premia i clienti e aumenta la fidelizzazione. Inizia in 2 minuti!',
        keywords: 'carta fedeltà digitale, app premi clienti, programma fedeltà gratuito, tessera fedeltà digitale, carta fedeltà mobile',
        canonical: 'https://loyalcard.net/?lang=it'
      },
      ro: {
        title: 'LoyalCard - Card de Fidelitate Digital | Program Loialitate Gratuit',
        description: 'Platformă gratuită de carduri de fidelitate digitale pentru afaceri. Creează programe de loialitate mobile, recompensează clienții și crește retenția. Fără costuri!',
        keywords: 'card de fidelitate digital, aplicație recompense clienți, program loialitate gratuit, card digital puncte, card loialitate mobil',
        canonical: 'https://loyalcard.net/?lang=ro'
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

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = meta.canonical

    // Update html lang attribute
    document.documentElement.lang = language
  }, [language])

  // Funzione per chiudere il menu con animazione
  const closeMenu = () => {
    setMenuClosing(true)
    setDragOffset(320) // Reset offset to fully closed
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
    <div ref={containerRef} className="landing-page-container relative w-full min-h-screen">
      {/* Static wave background - optimized performance */}
      <div className="fixed inset-0 z-0 h-screen overflow-hidden">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900"></div>
        
        {/* Animated gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-800/50 via-blue-800/30 to-pink-800/40 animate-pulse" style={{ animationDuration: '8s' }}></div>
        
        {/* SVG Wave layers */}
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none" viewBox="0 0 1440 800">
          <path fill="url(#landing-wave1)" d="M0,320 C320,380 420,280 720,320 C1020,360 1120,280 1440,320 L1440,800 L0,800 Z" opacity="0.7">
            <animate attributeName="d" dur="20s" repeatCount="indefinite"
              values="M0,320 C320,380 420,280 720,320 C1020,360 1120,280 1440,320 L1440,800 L0,800 Z;
                      M0,280 C320,240 420,340 720,280 C1020,220 1120,320 1440,280 L1440,800 L0,800 Z;
                      M0,320 C320,380 420,280 720,320 C1020,360 1120,280 1440,320 L1440,800 L0,800 Z" />
          </path>
          <path fill="url(#landing-wave2)" d="M0,400 C360,450 540,350 900,400 C1260,450 1440,350 1440,400 L1440,800 L0,800 Z" opacity="0.5">
            <animate attributeName="d" dur="15s" repeatCount="indefinite"
              values="M0,400 C360,450 540,350 900,400 C1260,450 1440,350 1440,400 L1440,800 L0,800 Z;
                      M0,350 C360,300 540,400 900,350 C1260,300 1440,400 1440,350 L1440,800 L0,800 Z;
                      M0,400 C360,450 540,350 900,400 C1260,450 1440,350 1440,400 L1440,800 L0,800 Z" />
          </path>
          <path fill="url(#landing-wave3)" d="M0,480 C400,520 640,450 1000,480 C1360,510 1440,460 1440,480 L1440,800 L0,800 Z" opacity="0.4">
            <animate attributeName="d" dur="25s" repeatCount="indefinite"
              values="M0,480 C400,520 640,450 1000,480 C1360,510 1440,460 1440,480 L1440,800 L0,800 Z;
                      M0,460 C400,420 640,490 1000,460 C1360,430 1440,500 1440,460 L1440,800 L0,800 Z;
                      M0,480 C400,520 640,450 1000,480 C1360,510 1440,460 1440,480 L1440,800 L0,800 Z" />
          </path>
          <defs>
            <linearGradient id="landing-wave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6"/>
            </linearGradient>
            <linearGradient id="landing-wave2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5"/>
            </linearGradient>
            <linearGradient id="landing-wave3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Overlay gradient for better text readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10 h-screen pointer-events-none"></div>

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
            className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[9999] flex flex-col ${
              isDragging.current ? '' : 'transition-transform duration-300 ease-out'
            }`}
            style={{
              transform: isDragging.current && !menuClosing 
                ? `translateX(${dragOffset}px)` 
                : menuClosing 
                  ? 'translateX(100%)' 
                  : 'translateX(0)'
            }}
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
            <nav className="flex-1 overflow-y-auto py-2">
              <button
                onClick={() => {
                  closeMenu()
                  setTimeout(scrollToTop, 300)
                }}
                className="w-full px-6 py-2.5 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
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
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                  }, 300)
                }}
                className="w-full px-6 py-2.5 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
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
                className="w-full px-6 py-2.5 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg">{t.menu.faq}</span>
              </button>

              <button
                onClick={() => {
                  closeMenu()
                  navigate('/pricing')
                }}
                className="w-full px-6 py-2.5 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg">{language === 'ro' ? 'Prețuri' : language === 'it' ? 'Prezzi' : 'Pricing'}</span>
              </button>

              <button
                onClick={() => {
                  closeMenu()
                  navigate('/contact')
                }}
                className="w-full px-6 py-2.5 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-lg">{language === 'ro' ? 'Contactează-ne' : language === 'it' ? 'Contattaci' : 'Contact Us'}</span>
              </button>

              <button
                onClick={() => {
                  closeMenu()
                  setTimeout(() => {
                    document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })
                  }, 300)
                }}
                className="w-full px-6 py-2.5 text-left text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-4"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-lg">{t.menu.footer}</span>
              </button>
            </nav>

            {/* Language Toggle - Spostato in basso per accessibilità mobile */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                 Language / Limba
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`py-2 px-2 rounded-lg font-semibold transition-all ${
                    language === 'en'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🇬🇧 EN
                </button>
                <button
                  onClick={() => setLanguage('ro')}
                  className={`py-2 px-2 rounded-lg font-semibold transition-all ${
                    language === 'ro'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🇷🇴 RO
                </button>
                <button
                  onClick={() => setLanguage('it')}
                  className={`py-2 px-2 rounded-lg font-semibold transition-all ${
                    language === 'it'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🇮🇹 IT
                </button>
              </div>
            </div>

            {/* My Dashboard Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  closeMenu()
                  setTimeout(() => navigate('/dashboard'), 300)
                }}
                className="w-full px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3 font-semibold mb-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t.menu.myDashboard}
              </button>
            </div>

            {/* Admin Button - In fondo */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  closeMenu()
                  setTimeout(() => navigate('/admin/login'), 300)
                }}
                className="w-full px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-3 font-semibold"
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
            
            {/* Menu Button - Enhanced Design */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Menu button clicked!')
                setMenuOpen(true)
                setDragOffset(0) // Fully open when clicking button
                setMenuClosing(false) // Ensure not closing
              }}
              className="group relative p-3.5 bg-gradient-to-br from-primary-500/90 to-primary-600/90 backdrop-blur-md text-white rounded-xl hover:from-primary-400 hover:to-primary-500 hover:shadow-lg hover:shadow-primary-500/40 active:scale-95 transition-all duration-300 border border-white/30"
              aria-label="Menu"
            >
              <svg 
                className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Pulse effect on hover */}
              <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity"></span>
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
                onClick={() => navigate('/select-tenant')}
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
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
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

      {/* How It Works - Example Cards Section */}
      <section id="how-it-works" className="relative z-30 bg-white py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {language === 'ro' ? 'Cum Funcționează?' : language === 'it' ? 'Come Funziona?' : 'How Does It Work?'}
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {language === 'ro'
                ? 'Iată câteva exemple reale de programe de fidelitate cu LoyalCard'
                : language === 'it'
                ? 'Ecco alcuni esempi reali di programmi fedeltà con LoyalCard'
                : 'Here are some real examples of loyalty programs with LoyalCard'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Card 1 - Coffee Shop */}
            <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 shadow-xl border-2 border-amber-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              {/* Business header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 010 4h-2M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Café Central</div>
                  <div className="text-xs text-gray-500">
                    {language === 'ro' ? 'Cafenea' : language === 'it' ? 'Caffetteria' : 'Coffee Shop'}
                  </div>
                </div>
              </div>

              {/* Reward rule */}
              <div className="bg-white/80 rounded-2xl p-4 mb-5 border border-amber-100">
                <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                  {language === 'ro' ? 'Regulă de recompensă' : language === 'it' ? 'Regola premio' : 'Reward rule'}
                </div>
                <div className="flex items-start gap-2 text-gray-800 font-medium text-sm">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 010 4h-2M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                  </svg>
                  <span>
                    {language === 'ro'
                      ? 'Cumpără 6 cafele → al 7-lea este GRATUIT'
                      : language === 'it'
                      ? 'Acquista 6 caffè → il 7° è GRATIS'
                      : 'Buy 6 coffees → 7th one is FREE'}
                  </span>
                </div>
              </div>

              {/* Stamp progress - almost complete (6/7) */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {language === 'ro' ? 'Progres' : language === 'it' ? 'Progresso' : 'Progress'}
                  </span>
                  <span className="text-xs font-bold text-amber-600">6/7</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 010 4h-2M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                      </svg>
                    </div>
                  ))}
                  <div className="w-9 h-9 bg-gray-100 border-2 border-dashed border-amber-300 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 010 4h-2M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>
                  {language === 'ro'
                    ? 'Încă 1 cafea și câștigi premiul!'
                    : language === 'it'
                    ? 'Ancora 1 caffè e vinci il premio!'
                    : 'Just 1 more coffee to win the prize!'}
                </span>
              </div>
            </div>

            {/* Card 2 - Restaurant */}
            <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 shadow-xl border-2 border-emerald-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              {/* Business header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Bistro Verde</div>
                  <div className="text-xs text-gray-500">
                    {language === 'ro' ? 'Restaurant' : language === 'it' ? 'Ristorante' : 'Restaurant'}
                  </div>
                </div>
              </div>

              {/* Reward rule */}
              <div className="bg-white/80 rounded-2xl p-4 mb-5 border border-emerald-100">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
                  {language === 'ro' ? 'Regulă de recompensă' : language === 'it' ? 'Regola premio' : 'Reward rule'}
                </div>
                <div className="flex items-start gap-2 text-gray-800 font-medium text-sm">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>
                    {language === 'ro'
                      ? '5 mese principale → desert GRATUIT sau 20% reducere'
                      : language === 'it'
                      ? '5 piatti principali → dessert GRATIS o 20% sconto'
                      : '5 main dishes → FREE dessert or 20% discount'}
                  </span>
                </div>
              </div>

              {/* Stamp progress - complete! (5/5) */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {language === 'ro' ? 'Progres' : language === 'it' ? 'Progresso' : 'Progress'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-emerald-600">5/5</span>
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reward unlocked banner */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-3 text-center flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  {language === 'ro' ? 'PREMIU CÂȘTIGAT!' : language === 'it' ? 'PREMIO VINTO!' : 'REWARD EARNED!'}
                </div>
                <div className="text-emerald-100 text-xs">
                  {language === 'ro'
                    ? 'Arată cardul la casă pentru a-l valorifica'
                    : language === 'it'
                    ? 'Mostra la carta alla cassa per riscattarlo'
                    : 'Show the card at checkout to redeem it'}
                </div>
              </div>
            </div>

            {/* Card 3 - Hair Salon */}
            <div className="group relative bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-6 shadow-xl border-2 border-pink-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              {/* Business header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Style Salon</div>
                  <div className="text-xs text-gray-500">
                    {language === 'ro' ? 'Frizerie' : language === 'it' ? 'Parrucchiere' : 'Hair Salon'}
                  </div>
                </div>
              </div>

              {/* Reward rule */}
              <div className="bg-white/80 rounded-2xl p-4 mb-5 border border-pink-100">
                <div className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-2">
                  {language === 'ro' ? 'Regulă de recompensă' : language === 'it' ? 'Regola premio' : 'Reward rule'}
                </div>
                <div className="flex items-start gap-2 text-gray-800 font-medium text-sm">
                  <svg className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                  </svg>
                  <span>
                    {language === 'ro'
                      ? '4 tăieturi → un spălat GRATUIT sau 30% reducere la tuns'
                      : language === 'it'
                      ? '4 tagli → un lavaggio GRATIS o 30% sconto sul taglio'
                      : '4 cuts → FREE wash or 30% off your next cut'}
                  </span>
                </div>
              </div>

              {/* Stamp progress (3/4) */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {language === 'ro' ? 'Progres' : language === 'it' ? 'Progresso' : 'Progress'}
                  </span>
                  <span className="text-xs font-bold text-pink-600">3/4</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-9 h-9 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                      </svg>
                    </div>
                  ))}
                  <div className="w-9 h-9 bg-gray-100 border-2 border-dashed border-pink-300 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>
                  {language === 'ro'
                    ? 'Încă 1 tuns și câștigi premiul!'
                    : language === 'it'
                    ? 'Ancora 1 taglio e vinci il premio!'
                    : 'Just 1 more cut to win the prize!'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6 text-lg">
              {language === 'ro'
                ? 'Alege partenerul tău și începe să acumulezi puncte acum!'
                : language === 'it'
                ? 'Scegli il tuo partner e inizia ad accumulare punti ora!'
                : 'Choose your partner and start collecting points now!'}
            </p>
            <button
              onClick={() => navigate('/select-tenant')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-lg font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/40 hover:scale-105"
            >
              {language === 'ro' ? 'Descoperă Parteneri' : language === 'it' ? 'Scopri i Partner' : 'Discover Partners'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Proven Results Section */}
      <section className="relative z-30 bg-gradient-to-br from-purple-50 via-white to-blue-50 py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.provenResults.title}
            </h3>
            <p className="text-lg text-gray-600">
              {t.provenResults.subtitle}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {/* Stat 1 - Retention */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-6 text-center min-h-[3rem] flex items-center justify-center">
                {t.provenResults.stat1.label}
              </h4>
              
              {/* Labels e numeri con altezza fissa */}
              <div className="flex justify-center gap-4 mb-2">
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs font-semibold text-gray-500 mb-1 h-8 flex items-center">
                    {t.provenResults.before}
                  </div>
                  <div className="text-xl font-bold text-gray-600 h-8 flex items-center">
                    {t.provenResults.stat1.before}
                  </div>
                </div>

                {/* Arrow spacer */}
                <div className="w-6"></div>

                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs font-semibold text-purple-600 mb-1 h-8 flex items-center">
                    {t.provenResults.after}
                  </div>
                  <div className="text-xl font-bold text-purple-600 h-8 flex items-center">
                    {t.provenResults.stat1.after}
                  </div>
                </div>
              </div>

              {/* Barre con freccia */}
              <div className="flex items-end justify-center gap-4 mb-4 h-32">
                {/* Before Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: '80px' }}
                  ></div>
                </div>

                {/* Arrow */}
                <div className="flex items-center mb-10">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* After Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: '102px' }}
                  ></div>
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-purple-100 rounded-full">
                  <span className="text-2xl font-bold text-purple-600">{t.provenResults.stat1.value}</span>
                </div>
              </div>

              <a 
                href={t.provenResults.stat1.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-1"
              >
                <span>{t.provenResults.sourceLabel}</span>
                <span className="underline">{t.provenResults.stat1.source}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Stat 2 - Repeat Visits */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-6 text-center min-h-[3rem] flex items-center justify-center">
                {t.provenResults.stat2.label}
              </h4>
              
              {/* Labels e numeri con altezza fissa */}
              <div className="flex justify-center gap-4 mb-2">
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs font-semibold text-gray-500 mb-1 h-8 flex items-center">
                    {t.provenResults.before}
                  </div>
                  <div className="text-xl font-bold text-gray-600 h-8 flex items-center">
                    {t.provenResults.stat2.before}
                  </div>
                </div>

                {/* Arrow spacer */}
                <div className="w-6"></div>

                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs font-semibold text-blue-600 mb-1 h-8 flex items-center">
                    {t.provenResults.after}
                  </div>
                  <div className="text-xl font-bold text-blue-600 h-8 flex items-center">
                    {t.provenResults.stat2.after}
                  </div>
                </div>
              </div>

              {/* Barre con freccia */}
              <div className="flex items-end justify-center gap-4 mb-4 h-32">
                {/* Before Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: '80px' }}
                  ></div>
                </div>

                {/* Arrow */}
                <div className="flex items-center mb-10">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* After Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: '128px' }}
                  ></div>
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-blue-100 rounded-full">
                  <span className="text-2xl font-bold text-blue-600">{t.provenResults.stat2.value}</span>
                </div>
              </div>

              <a 
                href={t.provenResults.stat2.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
              >
                <span>{t.provenResults.sourceLabel}</span>
                <span className="underline">{t.provenResults.stat2.source}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Stat 3 - Revenue */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-6 text-center min-h-[3rem] flex items-center justify-center">
                {t.provenResults.stat3.label}
              </h4>
              
              {/* Labels e numeri con altezza fissa */}
              <div className="flex justify-center gap-4 mb-2">
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs font-semibold text-gray-500 mb-1 h-8 flex items-center">
                    {t.provenResults.before}
                  </div>
                  <div className="text-xl font-bold text-gray-600 h-8 flex items-center">
                    {t.provenResults.stat3.before}
                  </div>
                </div>

                {/* Arrow spacer */}
                <div className="w-6"></div>

                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs font-semibold text-green-600 mb-1 h-8 flex items-center">
                    {t.provenResults.after}
                  </div>
                  <div className="text-xl font-bold text-green-600 h-8 flex items-center">
                    {t.provenResults.stat3.after}
                  </div>
                </div>
              </div>

              {/* Barre con freccia */}
              <div className="flex items-end justify-center gap-4 mb-4 h-32">
                {/* Before Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: '80px' }}
                  ></div>
                </div>

                {/* Arrow */}
                <div className="flex items-center mb-10">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* After Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: '100px' }}
                  ></div>
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-green-100 rounded-full">
                  <span className="text-2xl font-bold text-green-600">{t.provenResults.stat3.value}</span>
                </div>
              </div>

              <a 
                href={t.provenResults.stat3.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-green-600 transition-colors flex items-center justify-center gap-1"
              >
                <span>{t.provenResults.sourceLabel}</span>
                <span className="underline">{t.provenResults.stat3.source}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Stat 4 - Lifetime Value */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-6 text-center min-h-[3rem] flex items-center justify-center">
                {t.provenResults.stat4.label}
              </h4>
              
              {/* Labels e numeri con altezza fissa */}
              <div className="flex justify-center gap-4 mb-2">
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs font-semibold text-gray-500 mb-1 h-8 flex items-center">
                    {t.provenResults.before}
                  </div>
                  <div className="text-xl font-bold text-gray-600 h-8 flex items-center">
                    {t.provenResults.stat4.before}
                  </div>
                </div>

                {/* Arrow spacer */}
                <div className="w-6"></div>

                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs font-semibold text-orange-600 mb-1 h-8 flex items-center">
                    {t.provenResults.after}
                  </div>
                  <div className="text-xl font-bold text-orange-600 h-8 flex items-center">
                    {t.provenResults.stat4.after}
                  </div>
                </div>
              </div>

              {/* Barre con freccia */}
              <div className="flex items-end justify-center gap-4 mb-4 h-32">
                {/* Before Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: '80px' }}
                  ></div>
                </div>

                {/* Arrow */}
                <div className="flex items-center mb-10">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                {/* After Bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-16 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: '104px' }}
                  ></div>
                </div>
              </div>

              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 bg-orange-100 rounded-full">
                  <span className="text-2xl font-bold text-orange-600">{t.provenResults.stat4.value}</span>
                </div>
              </div>

              <a 
                href={t.provenResults.stat4.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-orange-600 transition-colors flex items-center justify-center gap-1"
              >
                <span>{t.provenResults.sourceLabel}</span>
                <span className="underline">{t.provenResults.stat4.source}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 italic">
              💡 {language === 'ro' ? 'Aceste statistici sunt bazate pe cercetări independente din industria programelor de loialitate' : language === 'it' ? 'Queste statistiche sono basate su ricerche indipendenti nel settore dei programmi fedeltà' : 'These statistics are based on independent research in the loyalty programs industry'}
            </p>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="relative z-30 bg-gradient-to-br from-purple-50 via-white to-blue-50 py-16 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.forWho.title}
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {language === 'ro' ? 'Soluție completă pentru ambele părți' : language === 'it' ? 'Soluzione completa per entrambe le parti' : 'Complete solution for both sides'}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            {/* For Businesses - Enhanced */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-white rounded-3xl p-8 shadow-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500"></div>
              
              <div className="relative flex flex-col h-full">
                {/* Icon with animation */}
                <div className="relative mb-6 inline-block">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  {/* Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>

                <h4 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-3">
                  {t.forWho.businesses.title}
                </h4>
                <p className="text-gray-600 mb-6 text-lg">{t.forWho.businesses.subtitle}</p>
                
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-gray-700 group/item hover:translate-x-2 transition-transform">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{t.forWho.businesses.benefit1}</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700 group/item hover:translate-x-2 transition-transform">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{t.forWho.businesses.benefit2}</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700 group/item hover:translate-x-2 transition-transform">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{t.forWho.businesses.benefit3}</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700 group/item hover:translate-x-2 transition-transform">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{t.forWho.businesses.benefit4}</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => navigate('/contact')}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 group/btn mt-auto"
                >
                  <span>{language === 'ro' ? 'Începe Acum' : language === 'it' ? 'Inizia Ora' : 'Start Now'}</span>
                  <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* For Customers - Enhanced */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-white rounded-3xl p-8 shadow-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:scale-105 transition-all duration-500">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500"></div>
              
              <div className="relative flex flex-col h-full">
                {/* Icon with animation */}
                <div className="relative mb-6 inline-block">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  {/* Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <h4 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-3">
                  {t.forWho.customers.title}
                </h4>
                <p className="text-gray-600 mb-6 text-lg">{t.forWho.customers.subtitle}</p>
                
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-gray-700 group/item hover:translate-x-2 transition-transform">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{t.forWho.customers.benefit1}</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700 group/item hover:translate-x-2 transition-transform">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{t.forWho.customers.benefit2}</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700 group/item hover:translate-x-2 transition-transform">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{t.forWho.customers.benefit3}</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700 group/item hover:translate-x-2 transition-transform">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{t.forWho.customers.benefit4}</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    navigate('/dashboard')
                    setTimeout(() => window.scrollTo(0, 0), 0)
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 group/btn mt-auto"
                >
                  <span>{language === 'ro' ? 'Obține Cardul' : language === 'it' ? 'Ottieni la Carta' : 'Get Card'}</span>
                  <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is a loyalty card - callout above FAQ */}
      <section className="relative z-30 bg-white pt-12 sm:pt-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-5 sm:p-6 flex gap-4 items-start">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1 text-base sm:text-lg">
                {language === 'ro'
                  ? 'Ce este un card de fidelitate digital?'
                  : language === 'it'
                  ? "Cos'è una carta fedeltà digitale?"
                  : 'What is a digital loyalty card?'}
              </h4>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {language === 'ro'
                  ? 'Un card de fidelitate digital înlocuiește cardul plastic tradițional: clienții acumulează timbre sau puncte la fiecare achiziție și câștigă recompense. Cu LoyalCard, cardul tău de fidelitate este gratuit, mereu pe telefon și nu necesită descărcarea unei aplicații.'
                  : language === 'it'
                  ? "Una carta fedeltà digitale sostituisce quella fisica tradizionale: i clienti accumulano timbri o punti ad ogni acquisto e guadagnano premi. Con LoyalCard, la tua carta fedeltà è gratuita, sempre sul telefono e non richiede di scaricare un'app."
                  : 'A digital loyalty card replaces the traditional plastic card: customers collect stamps or points at every purchase and earn rewards. With LoyalCard, your free loyalty rewards card is always on your phone and requires no app download.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Collapsable */}
      <section id="faq" className="relative z-30 bg-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* FAQ Header - Clickable Button */}
          <button
            onClick={() => setFaqSectionOpen(!faqSectionOpen)}
            className="w-full group bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 hover:border-primary-400 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 mb-8"
          >
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
                {t.faq.title}
              </h3>
              
              <div className="flex items-center gap-3 text-primary-600">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full">
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${faqSectionOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="font-semibold text-sm">
                    {faqSectionOpen 
                      ? (language === 'ro' ? 'Ascunde întrebările' : language === 'it' ? 'Nascondi domande' : 'Hide questions')
                      : (language === 'ro' ? 'Arată întrebările (8)' : language === 'it' ? 'Mostra domande (8)' : 'Show questions (8)')
                    }
                  </span>
                </div>
              </div>
            </div>
          </button>
          
          {/* FAQ Content - Collapsable */}
          {faqSectionOpen && (
            <div className="space-y-4 animate-fadeIn">
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
          )}
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section className="relative z-30 bg-gradient-to-br from-purple-600 to-blue-600 py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            {language === 'ro' ? 'Planuri Personalizate Pentru Afacerea Ta' : language === 'it' ? 'Piani Personalizzati Per La Tua Attività' : 'Custom Plans For Your Business'}
          </h3>
          <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
            {language === 'ro' 
              ? 'De la gratuit pentru a începe, până la soluții enterprise pentru afaceri mari. Alege planul perfect pentru nevoile tale.'
              : language === 'it'
              ? 'Dal gratuito per iniziare, alle soluzioni enterprise per grandi aziende. Scegli il piano perfetto per le tue esigenze.'
              : 'From free to get started, to enterprise solutions for large businesses. Choose the perfect plan for your needs.'}
          </p>

          {/* Quick Pricing Preview - Only 3 plans */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-all">
              <div className="text-green-300 font-bold text-sm mb-3">STARTER</div>
              <div className="text-5xl font-bold text-white mb-2">€0</div>
              <div className="text-purple-200 text-sm">{language === 'ro' ? '/lună' : language === 'it' ? '/mese' : '/month'}</div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-8 border-2 border-yellow-400 relative hover:bg-white/25 transition-all transform hover:scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                {language === 'ro' ? 'POPULAR' : language === 'it' ? 'POPOLARE' : 'POPULAR'}
              </div>
              <div className="text-yellow-300 font-bold text-sm mb-3">BUSINESS</div>
              <div className="text-5xl font-bold text-white mb-2">€30</div>
              <div className="text-purple-200 text-sm">{language === 'ro' ? '/lună' : language === 'it' ? '/mese' : '/month'}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-all">
              <div className="text-blue-300 font-bold text-sm mb-3">PROFESSIONAL</div>
              <div className="text-5xl font-bold text-white mb-2">€60</div>
              <div className="text-purple-200 text-sm">{language === 'ro' ? '/lună' : language === 'it' ? '/mese' : '/month'}</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/pricing')}
              className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {language === 'ro' ? 'Vezi Toate Planurile' : language === 'it' ? 'Vedi Tutti i Piani' : 'View All Plans'}
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border-2 border-white/30"
            >
              {language === 'ro' ? 'Contactează-ne' : language === 'it' ? 'Contattaci' : 'Contact Us'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="relative z-30 bg-gray-900 text-white py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Compact Footer - All in one line */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-sm text-gray-400 mb-4">
            {/* Legal Links */}
            <a href="/privacy" className="hover:text-white transition-colors">
              {t.footerNav.privacy}
            </a>
            <span className="hidden sm:inline text-gray-600">•</span>
            <a href="/terms" className="hover:text-white transition-colors">
              {t.footerNav.terms}
            </a>
            <span className="hidden sm:inline text-gray-600">•</span>
            <a href="/cookie-policy" className="hover:text-white transition-colors">
              {t.footerNav.cookies}
            </a>
            <span className="hidden sm:inline text-gray-600">•</span>
            <a href="/refund" className="hover:text-white transition-colors">
              {t.footerNav.refund}
            </a>
            <span className="hidden sm:inline text-gray-600">•</span>
            <a href="/acceptable-use" className="hover:text-white transition-colors">
              {t.footerNav.acceptableUse}
            </a>
            
            {/* Divider */}
            <span className="hidden sm:inline text-gray-600 mx-2">|</span>
            
            {/* Contact */}
            <a
              href="/contact"
              className="hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t.footerNav.contactUs}
            </a>
            
            {/* Social */}
            <span className="hidden sm:inline text-gray-600">•</span>
            <a
              href="https://www.instagram.com/loyal.card/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              {t.footerNav.instagram}
            </a>
          </div>
          
          {/* Copyright */}
          <div className="text-center text-xs text-gray-500">
            <p>{t.footerNav.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
