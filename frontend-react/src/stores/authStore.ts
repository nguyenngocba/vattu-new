import { create } from 'zustand'
import type { User } from '../services/api'

const STORAGE_KEY = 'steeltrack_react_user'

type AuthState = {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as User : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: readStoredUser(),
  setUser: (user) => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
    set({ user })
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ user: null })
  },
}))
