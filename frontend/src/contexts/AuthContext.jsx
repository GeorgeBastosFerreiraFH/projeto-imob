"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import api from "../services/api"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Usar useCallback para evitar recriação da função
  const checkAuth = useCallback(async () => {
    if (initialized) return // Evitar múltiplas chamadas

    try {
      const response = await api.get("/auth/me")
      setUser(response.data.user)
    } catch (error) {
      console.log("Usuário não autenticado")
      setUser(null)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [initialized])

  // useEffect com dependência vazia para executar apenas uma vez
  useEffect(() => {
    checkAuth()
  }, []) // Removido checkAuth das dependências para evitar loop

  const login = async (email, senha) => {
    try {
      const response = await api.post("/auth/login", { email, senha })
      setUser(response.data.user)
      return { success: true, user: response.data.user }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erro ao fazer login",
      }
    }
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    } finally {
      setUser(null)
      setInitialized(false) // Reset para permitir nova verificação
    }
  }

  const value = {
    user,
    login,
    logout,
    loading,
    checkAuth: useCallback(() => {
      if (!initialized) {
        checkAuth()
      }
    }, [initialized, checkAuth]),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
