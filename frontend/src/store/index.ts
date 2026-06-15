import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/lib/i18n'

interface CardData {
  clientId: string
  cardId: string
  qrCode: string
  tenantId: string
  customName?: string
}

interface ClientState {
  // Current active card
  clientId: string | null
  cardId: string | null
  qrCode: string | null
  tenantId: string | null
  // Tenant info for selection
  tenantName: string | null
  tenantSlug: string | null
  // All saved cards
  savedCards: CardData[]
  setClientData: (data: CardData) => void
  clearClientData: () => void
  setTenantData: (data: { tenantId: string; tenantName: string; tenantSlug: string }) => void
  addCard: (data: CardData) => void
  getAllCards: () => CardData[]
  getCard: (qrCode: string) => CardData | undefined
  updateCardName: (qrCode: string, customName: string) => void
  replaceAllCards: (cards: CardData[]) => void
  // Language
  language: Language
  setLanguage: (lang: Language) => void
  languageDetected: boolean
  clearAll: () => void
}

// Helper function to detect language based on IP geolocation
async function detectLanguageFromLocation(): Promise<Language> {
  try {
    // Use ipapi.co free API to detect country from IP (no API key required)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
    
    if (!response.ok) {
      throw new Error('Geolocation API failed')
    }
    
    const data = await response.json()
    const countryCode = data.country_code?.toUpperCase() || ''
    
    console.log('Detected country from IP:', countryCode)
    
    // Map country codes to languages
    if (countryCode === 'IT') {
      return 'it' // Italy → Italian
    } else if (countryCode === 'RO') {
      return 'ro' // Romania → Romanian
    } else if (['US', 'GB', 'CA', 'AU', 'NZ', 'IE'].includes(countryCode)) {
      return 'en' // English-speaking countries → English
    }
    
    // Default to English for any other country
    return 'en'
  } catch (error) {
    // If geolocation fails, try browser language as fallback
    console.log('Geolocation failed, using browser language fallback:', error)
    try {
      const browserLang = navigator.language || navigator.languages?.[0] || ''
      const langCode = browserLang.split('-')[0].toLowerCase()
      
      if (langCode === 'it') return 'it'
      if (langCode === 'ro') return 'ro'
      if (langCode === 'en') return 'en'
    } catch (e) {
      console.error('Browser language detection also failed:', e)
    }
    
    // Final fallback to English
    return 'en'
  }
}

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      clientId: null,
      cardId: null,
      qrCode: null,
      tenantId: null,
      tenantName: null,
      tenantSlug: null,
      savedCards: [],
      setClientData: (data: CardData) => {
        set(data)
        // Also add to saved cards if not already there
        const existing = get().savedCards.find(c => c.qrCode === data.qrCode)
        if (!existing) {
          set({ savedCards: [...get().savedCards, data] })
        }
      },
      clearClientData: () =>
        set({
          clientId: null,
          cardId: null,
          qrCode: null,
          tenantId: null,
          tenantName: null,
          tenantSlug: null
        }),
      setTenantData: (data) => set(data),
      addCard: (data: CardData) => {
        const existing = get().savedCards.find(c => c.qrCode === data.qrCode)
        if (!existing) {
          set({ savedCards: [...get().savedCards, data] })
        }
      },
      getAllCards: () => get().savedCards,
      getCard: (qrCode: string) => get().savedCards.find(c => c.qrCode === qrCode),
      updateCardName: (qrCode: string, customName: string) => {
        const cards = get().savedCards.map(card => 
          card.qrCode === qrCode ? { ...card, customName } : card
        )
        set({ savedCards: cards })
      },
      replaceAllCards: (cards: CardData[]) => {
        set({ savedCards: cards })
      },
      // Language with auto-detection
      language: 'en', // Will be updated by onRehydrateStorage
      languageDetected: false,
      setLanguage: (lang: Language) => set({ language: lang, languageDetected: true }),
      clearAll: () => set({
        clientId: null, cardId: null, qrCode: null,
        tenantId: null, tenantName: null, tenantSlug: null, savedCards: [],
      }),
    }),
    {
      name: 'loyalcard-client-storage',
      onRehydrateStorage: () => (state) => {
        // Auto-detect language only if not already detected/set by user
        if (state && !state.languageDetected) {
          // Use async detection based on IP geolocation
          detectLanguageFromLocation().then((detectedLang) => {
            if (!state.languageDetected) {
              state.language = detectedLang
              state.languageDetected = true
            }
          })
        }
      }
    }
  )
)

interface AuthState {
  user: any | null
  session: any | null
  tenantId: string | null
  role: 'super_admin' | 'owner' | 'staff' | null
  setAuth: (user: any, session: any, tenantId: string | null, role: 'super_admin' | 'owner' | 'staff') => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      tenantId: null,
      role: null,
      setAuth: (user: any, session: any, tenantId: string | null, role: 'super_admin' | 'owner' | 'staff') =>
        set({ user, session, tenantId, role }),
      clearAuth: () =>
        set({
          user: null,
          session: null,
          tenantId: null,
          role: null
        })
    }),
    {
      name: 'loyalcard-auth-storage'
    }
  )
)
