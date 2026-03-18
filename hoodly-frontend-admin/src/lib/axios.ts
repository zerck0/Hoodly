import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
});

let getTokenFunction: (() => Promise<string>) | null = null;

export function setTokenGetter(getter: () => Promise<string>) {
  getTokenFunction = getter;
}

apiClient.interceptors.request.use(async (config) => {
  if (getTokenFunction) {
    try {
      const token = await getTokenFunction();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
  }
  return config;
});
