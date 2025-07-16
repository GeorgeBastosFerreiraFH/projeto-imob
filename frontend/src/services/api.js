import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    console.error("❌ Erro na requisição:", error)
    return Promise.reject(error)
  },
)

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    }
    return response
  },
  (error) => {
    console.error("❌ Erro na resposta:", error.response?.status, error.response?.data)

    // Redirecionar para login apenas se for erro 401 e não estiver já na página de login
    if (error.response?.status === 401 && !window.location.pathname.includes("/login")) {
      window.location.href = "/login"
    }

    return Promise.reject(error)
  },
)

export default api
