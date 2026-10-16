import api, { AUTH_TOKEN_KEY, AUTH_USER_KEY } from './http/client'
import { clearSaleDraft } from './saleDraft.service'

export function isAuthenticated() {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
}

export async function login(credentials) {
  const { data } = await api.post('/login', credentials)
  localStorage.setItem(AUTH_TOKEN_KEY, data.token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
  return data.user
}

export async function register(payload) {
  const { data } = await api.post('/register', payload)
  return data
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  clearSaleDraft()
}
