import { CareRecipient, Medication, MedicationDose, MedicationSchedule } from '@/types'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Always attach the latest JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

// Handle 401 errors (JWT expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('JWT expired, clearing token and redirecting...')
      localStorage.removeItem('jwt')
      // Force redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Care Recipients API
export const recipientsApi = {
  getAll: async () => {
    const res = await api.get<CareRecipient[]>('/recipients')
    return res.data
  },
  getById: async (id: number) => {
    const res = await api.get<CareRecipient>(`/recipients/${id}`)
    return res.data
  },
  create: async (data: { name: string; date_of_birth?: string }) => {
    const res = await api.post<CareRecipient>('/recipients', data)
    return res.data
  },
}

// Medications API
export const medicationsApi = {
  getByRecipient: async (recipientId: number) => {
    const res = await api.get<Medication[]>(`/recipients/${recipientId}/medications`)
    return res.data
  },
  getById: async (recipientId: number, id: number) => {
    const res = await api.get<Medication>(`/recipients/${recipientId}/medications/${id}`)
    return res.data
  },
  create: async (
    recipientId: number,
    data: {
      name: string
      description?: string
      dosage: string
      instructions?: string
      schedule: Array<{
        weekday: string
        time: string
      }>
    }
  ) => {
    const res = await api.post<Medication>(`/recipients/${recipientId}/medications`, data)
    return res.data
  },
  markInactive: async (recipientId: number, id: number) => {
    const res = await api.put(`/recipients/${recipientId}/medications/${id}`, { mark_inactive: true })
    return res.data
  },
}

// Medication Schedules API
export const medicationSchedulesApi = {
  getByMedication: async (recipientId: number, medicationId: number) => {
    const res = await api.get<any[]>(`/recipients/${recipientId}/medications/${medicationId}/schedule`)
    return res.data
  },
}

// Doses API
export const dosesApi = {
  getUpcoming: async (recipientId: number, period: 'daily' | 'weekly' = 'daily') => {
    const res = await api.get<MedicationDose[]>(`/recipients/${recipientId}/doses?period=${period}`)
    return res.data
  },
  markAsTaken: async (recipientId: number, doseId: number) => {
    const res = await api.put(`/recipients/${recipientId}/doses/${doseId}/take`)
    return res.data
  },
}

export default api
