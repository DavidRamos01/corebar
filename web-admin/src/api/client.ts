import axios from 'axios'

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_HOST ?? 'https://api.corebar.es'}/api`,
  timeout: 12000,
})

client.interceptors.request.use(config => {
  const token = localStorage.getItem('cb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cb_token')
      localStorage.removeItem('cb_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
