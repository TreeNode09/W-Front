import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5000').replace(/\/$/, '')

export const http = axios.create({
  baseURL,
  timeout: 15000,
})

export { baseURL }
