import { useNavigate } from 'react-router-dom'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

export default function LandingPage() {
  const navigate = useNavigate()
  const { language } = useClientStore()
  const t = getTranslation(language)

  return (
    <div className="relative w-full h-screen overflow-hidden">
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

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col">
        {/* Header */}
        <header className="pt-8 px-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {t.appName}
            </h1>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button
                onClick={() => navigate('/admin/login')}
                className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                Admin
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              {t.hero.title}
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/card')}
                className="group px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-lg font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-600/60 hover:scale-105"
              >
                <span className="flex items-center gap-2">
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
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                {t.hero.learnMore}
              </button>
            </div>
          </div>
        </main>

        {/* Stats */}
        <div className="pb-20 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-gray-300">{t.stats.digital}</div>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="text-4xl font-bold text-white mb-2">∞</div>
              <div className="text-gray-300">{t.stats.rewards}</div>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="text-4xl font-bold text-white mb-2">0€</div>
              <div className="text-gray-300">{t.stats.cost}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section (scrollable) */}
      <section id="features" className="relative bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-gray-900 text-center mb-16">
            {t.features.title}
          </h3>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📱</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">
                {t.features.step1.title}
              </h4>
              <p className="text-gray-600">
                {t.features.step1.description}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📸</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">
                {t.features.step2.title}
              </h4>
              <p className="text-gray-600">
                {t.features.step2.description}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🎁</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">
                {t.features.step3.title}
              </h4>
              <p className="text-gray-600">
                {t.features.step3.description}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
