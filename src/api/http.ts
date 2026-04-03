import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE

export const http = axios.create({
  baseURL,
  timeout: 15000
})

export { baseURL }