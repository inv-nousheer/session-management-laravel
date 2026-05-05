import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Accept': 'application/json',
  }
})

// attach token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
   // Axios v1 may use AxiosHeaders; support both shapes
    if (config.headers?.set) config.headers.set('Authorization', `Bearer ${token}`)
    else {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  // Let the browser/axios set the correct multipart boundary for FormData.
  // For JSON payloads, ensure we send application/json.
  const isFormData =
    typeof FormData !== 'undefined' &&
    config.data instanceof FormData

  if (isFormData) {
    if (config.headers?.delete) config.headers.delete('Content-Type')
    else if (config.headers?.set) config.headers.set('Content-Type', undefined)
    else if (config.headers) delete config.headers['Content-Type']
  } else if (config.data && typeof config.data === 'object') {
    if (config.headers?.set) config.headers.set('Content-Type', 'application/json')
    else {
      config.headers = config.headers ?? {}
      config.headers['Content-Type'] = 'application/json'
    }
  }

  return config
})

export default api
