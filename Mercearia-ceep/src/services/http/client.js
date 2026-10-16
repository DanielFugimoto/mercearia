import axios from 'axios'

export const AUTH_TOKEN_KEY = 'mercearia_token'
export const AUTH_USER_KEY = 'mercearia_usuario'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, ''),
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default api
