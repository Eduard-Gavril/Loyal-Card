import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ClientState {
  clientId: string | null
  cardId: string | null
  qrCode: string | null
  tenantId: string | null
  setClientData: (data: {
    clientId: string
    cardId: string
    qrCode: string
    tenantId: string
  }) => void
  clearClientData: () => void
}

export const useClientStore = create<ClientState>()(
  persist(
    (set) => ({
      clientId: null,
      cardId: null,
      qrCode: null,
      tenantId: null,
      setClientData: (data: { clientId: string; cardId: string; qrCode: string; tenantId: string }) => set(data),
      clearClientData: () =>
        set({
          clientId: null,
          cardId: null,
          qrCode: null,
          tenantId: null
        })
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
