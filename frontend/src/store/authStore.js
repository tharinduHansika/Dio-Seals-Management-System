import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      
      setUser: (user) => {
        console.log('Setting user in store:', user)
        set({ user })
      },
      
      setToken: (token) => {
        console.log('Setting token in store:', token)
        set({ token })
        // Also store in localStorage directly as backup
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
        }
      },
      
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('auth-storage')
        }
        set({ user: null, token: null })
      },
      
      // Helper to get current state
      getState: () => get(),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)