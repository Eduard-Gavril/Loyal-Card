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
  // All saved cards
  savedCards: CardData[]
  setClientData: (data: CardData) => void
  clearClientData: () => void
  addCard: (data: CardData) => void
  getAllCards: () => CardData[]
  getCard: (qrCode: string) => CardData | undefined
  updateCardName: (qrCode: string, customName: string) => void
  // Language
  language: Language
  setLanguage: (lang: Language) => void
}

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      clientId: null,
      cardId: null,
      qrCode: null,
      tenantId: null,
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
          tenantId: null
        }),
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
      // Language
      language: 'en',
      setLanguage: (lang: Language) => set({ language: lang })
    }),
    {
      name: 'fidelix-client-storage'
    }
  )
)

interface AuthState {
  user: any | null
  session: any | null
  tenantId: string | null
  role: 'owner' | 'staff' | null
  setAuth: (user: any, session: any, tenantId: string, role: 'owner' | 'staff') => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      tenantId: null,
      role: null,
      setAuth: (user: any, session: any, tenantId: string, role: 'owner' | 'staff') =>
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
      name: 'fidelix-auth-storage'
    }
  )
)
