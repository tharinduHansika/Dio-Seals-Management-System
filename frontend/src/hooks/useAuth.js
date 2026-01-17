import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, token, logout } = useAuthStore()

  const hasRole = (role) => {
    return user?.role === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role)
  }

  return {
    user,
    token,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!token && !!user,
  }
}