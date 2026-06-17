import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import type { Language } from '@/lib/i18n'

interface CardData {
  clientId: string
  cardId: string
  qrCode: string
  tenantId: string
  tenantName?: string
  customName?: string
}

interface ClientState {
  clientId: string | null
  cardId: string | null
  qrCode: string | null
  tenantId: string | null
  tenantName: string | null
  tenantSlug: string | null
  savedCards: CardData[]
  language: Language
  hasOnboarded: boolean
  linkedPhone: string | null
  displayName: string | null
  setClientData: (data: CardData) => void
  clearClientData: () => void
  setTenantData: (data: { tenantId: string; tenantName: string; tenantSlug: string }) => void
  addCard: (data: CardData) => void
  getAllCards: () => CardData[]
  replaceAllCards: (cards: CardData[]) => void
  totalRewards: number
  setLanguage: (lang: Language) => void
  setHasOnboarded: () => void
  setClientId: (id: string) => void
  setLinkedPhone: (phone: string) => void
  setDisplayName: (name: string) => void
  setTotalRewards: (n: number) => void
  clearAll: () => void
}

function detectLanguage(): Language {
  try {
    const locale = getLocales()[0]?.languageCode ?? 'en'
    if (locale === 'it') return 'it'
    if (locale === 'ro') return 'ro'
    return 'en'
  } catch {
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
      language: detectLanguage(),
      hasOnboarded: false,
      linkedPhone: null,
      displayName: null,
      totalRewards: 0,
      setClientData: (data) => {
        set(data)
        const existing = get().savedCards.find((c) => c.qrCode === data.qrCode)
        if (!existing) {
          set({ savedCards: [...get().savedCards, data] })
        }
      },
      clearClientData: () =>
        set({ clientId: null, cardId: null, qrCode: null, tenantId: null, tenantName: null, tenantSlug: null }),
      setTenantData: (data) => set(data),
      addCard: (data) => {
        const existing = get().savedCards.find((c) => c.qrCode === data.qrCode)
        if (!existing) {
          set({ savedCards: [...get().savedCards, data] })
        }
      },
      getAllCards: () => get().savedCards,
      replaceAllCards: (cards) => set({ savedCards: cards }),
      setLanguage: (lang) => set({ language: lang }),
      setHasOnboarded: () => set({ hasOnboarded: true }),
      setClientId: (id) => set({ clientId: id }),
      setLinkedPhone: (phone) => set({ linkedPhone: phone }),
      setDisplayName: (name) => set({ displayName: name }),
      setTotalRewards: (n) => set({ totalRewards: n }),
      clearAll: () => set({
        clientId: null, cardId: null, qrCode: null,
        tenantId: null, tenantName: null, tenantSlug: null,
        savedCards: [], linkedPhone: null, displayName: null, totalRewards: 0,
      }),
    }),
    {
      name: 'loyalcard-mobile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// ─── Admin Store ───────────────────────────────────────────────
interface AdminState {
  user: any | null
  session: any | null
  tenantId: string | null
  role: 'super_admin' | 'owner' | 'staff' | null
  setAuth: (user: any, session: any, tenantId: string | null, role: AdminState['role']) => void
  clearAuth: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      tenantId: null,
      role: null,
      setAuth: (user, session, tenantId, role) => set({ user, session, tenantId, role }),
      clearAuth: () => set({ user: null, session: null, tenantId: null, role: null }),
    }),
    {
      name: 'loyalcard-admin-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
