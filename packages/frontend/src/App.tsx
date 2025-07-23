import { Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import AddMedication from '@/pages/AddMedication'
import MedicationDetail from '@/pages/MedicationDetail'
import { useAuth } from './context/AuthContext'
import { RecipientProvider, useRecipient } from './context/RecipientContext'
import { Suspense, useEffect } from 'react'
import Login from './pages/Login'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      retryOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

const App = () => {
  // set up auth context
  const { token } = useAuth()
  const navigate = useNavigate()

  console.log('App render - token:', token ? 'exists' : 'null')

  useEffect(() => {
    console.log('App useEffect triggered - token:', token ? 'exists' : 'null')
    if (!token) {
      console.log('Redirecting to login...')
      navigate('/login')
      return
    }
  }, [token, navigate])

  // Don't try to load recipient data if no token
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <div className="flex items-center justify-center min-h-screen">
              <span>Redirecting to login...</span>
            </div>
          } />
        </Routes>
      </div>
    )
  }

  const { recipient, isLoading, error } = useRecipient()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span>Loading...</span>
      </div>
    )
  }

  if (error || !recipient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span>Error loading recipient.</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/medications/add" element={<AddMedication />} />
              <Route path="/medications/:medicationId" element={<MedicationDetail />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </div>
  )
}

const Root = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RecipientProvider>
        <Suspense fallback={
          <div className='flex items-center justify-center min-h-screen'>
            <span>Loading Care Recipient...</span>
          </div>
        }>
          <App />
        </Suspense>
      </RecipientProvider>
    </QueryClientProvider>
  )
}

export default Root
