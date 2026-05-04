import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

let getAccessToken: (() => Promise<string>) | null = null

export function setAuth0TokenGetter(getToken: () => Promise<string>) {
  getAccessToken = getToken
}

api.interceptors.request.use(async (config) => {
  if (getAccessToken) {
    try {
      const token = await getAccessToken()
      config.headers.Authorization = `Bearer ${token}`
    } catch {
      console.warn('Failed to get access token for API request')
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.url?.includes('/auth/me')) {
      return Promise.reject(error)
    }

    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message
      const errorMessage = Array.isArray(message) ? message[0] : message

      if (status >= 500) {
        toast.error('Erreur serveur. Réessayez plus tard.')
      } else if (status === 403 || status === 401) {
        toast.error('Action non autorisée.')
      } else if (errorMessage) {
        toast.error(errorMessage)
      } else {
        toast.error('Une erreur est survenue.')
      }
    } else if (error.request) {
      toast.error('Problème de connexion au serveur.')
    }
    return Promise.reject(error)
  }
)

export default api
