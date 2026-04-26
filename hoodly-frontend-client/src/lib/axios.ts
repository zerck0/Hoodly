import axios from 'axios'

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

export default api
