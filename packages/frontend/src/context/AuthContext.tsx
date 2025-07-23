import React, { createContext, useContext, useState, ReactNode } from 'react'

type AuthContextType = {
  token: string | null
  setToken: (token: string | null) => void
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("jwt") || null)

  console.log('AuthProvider render - token:', token ? 'exists' : 'null')

  // Wrap setToken to also update localStorage
  const setToken = (newToken: string | null) => {
    console.log('setToken called with:', newToken ? 'new token' : 'null')
    setTokenState(newToken)
    if (newToken) {
      localStorage.setItem('jwt', newToken)
    } else {
      localStorage.removeItem('jwt')
    }
  }

    const logout = () => setToken(null)

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated: !!token, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}