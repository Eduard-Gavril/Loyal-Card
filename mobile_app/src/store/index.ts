import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Language } from '@/lib/i18n'

interface CardData {
  clientId: string
  cardId: string
  qrCode: string
  tenantId: string
  tenantName?: string
  customName?: string
}

type LoyaltyStateInput = Record<string, { count?: number; rewards?: number } | undefined>
type LoyaltySnapshot = Record<string, Record<string, { count: number; rewards: number }>>

interface ClientState {
  clientId: string | null
  cardId: string | null
  qrCode: string | null
  tenantId: string | null
  tenantName: string | null
  tenantSlug: string | null
  savedCards: CardData[]
  language: Language
  darkMode: boolean
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
  lifetimeStamps: number
  lifetimeRewards: number
  loyaltySnapshot: LoyaltySnapshot
  setLanguage: (lang: Language) => void
  setDarkMode: (v: boolean) => void
  setHasOnboarded: () => void
  setClientId: (id: string) => void
  setLinkedPhone: (phone: string) => void
  setDisplayName: (name: string) => void
  setTotalRewards: (n: number) => void
  recordLoyaltyProgress: (byQrCode: Record<string, LoyaltyStateInput>) => void
  clearAll: () => void
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
      language: 'en',
      darkMode: false,
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
      setDarkMode: (v) => set({ darkMode: v }),
      setHasOnboarded: () => set({ hasOnboarded: true }),
      setClientId: (id) => set({ clientId: id }),
      setLinkedPhone: (phone) => set({ linkedPhone: phone }),
      setDisplayName: (name) => set({ displayName: name }),
      setTotalRewards: (n) => set({ totalRewards: n }),
      lifetimeStamps: 0,
      lifetimeRewards: 0,
      loyaltySnapshot: {},
      // Lifetime counters: accumulate positive deltas vs the last seen
      // loyalty_state. Rule counts reset to 0 on redeem, so a drop means
      // everything now visible is post-reset (all new stamps); reward drops
      // are redemptions, never subtracted.
      recordLoyaltyProgress: (byQrCode) => {
        const snapshot: LoyaltySnapshot = { ...get().loyaltySnapshot }
        let stampsDelta = 0
        let rewardsDelta = 0
        for (const [qr, state] of Object.entries(byQrCode)) {
          const prev = snapshot[qr] ?? {}
          const next = { ...prev }
          for (const [ruleId, st] of Object.entries(state ?? {})) {
            const count = st?.count ?? 0
            const rewards = st?.rewards ?? 0
            const old = prev[ruleId] ?? { count: 0, rewards: 0 }
            stampsDelta += count >= old.count ? count - old.count : count
            rewardsDelta += Math.max(0, rewards - old.rewards)
            next[ruleId] = { count, rewards }
          }
          snapshot[qr] = next
        }
        set({
          loyaltySnapshot: snapshot,
          lifetimeStamps: get().lifetimeStamps + stampsDelta,
          lifetimeRewards: get().lifetimeRewards + rewardsDelta,
        })
      },
      clearAll: () => set({
        clientId: null, cardId: null, qrCode: null,
        tenantId: null, tenantName: null, tenantSlug: null,
        savedCards: [], linkedPhone: null, displayName: null, totalRewards: 0,
        lifetimeStamps: 0, lifetimeRewards: 0, loyaltySnapshot: {},
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
