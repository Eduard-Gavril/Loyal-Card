import { useClientStore } from '@/store'
import type { Language } from '@/lib/i18n'

export default function LanguageSelector() {
  const { language, setLanguage } = useClientStore()
  
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
  }

  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1">
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 rounded text-sm font-semibold transition-all duration-200 ${
          language === 'en'
            ? 'bg-white text-gray-900'
            : 'text-white hover:bg-white/10'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('ro')}
        className={`px-3 py-1 rounded text-sm font-semibold transition-all duration-200 ${
          language === 'ro'
            ? 'bg-white text-gray-900'
            : 'text-white hover:bg-white/10'
        }`}
      >
        RO
      </button>
    </div>
  )
}
