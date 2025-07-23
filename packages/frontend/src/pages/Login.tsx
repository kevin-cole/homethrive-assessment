import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { fetchNewToken } from '@/services/auth'

const Login = () => {
  const { setToken } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      const token = await fetchNewToken()
      setToken(token)
      navigate('/')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <button
        className='px-4 py-2 bg-blue-600 text-white rounded'
        onClick={handleLogin}
      >
        Log In
      </button>
    </div>
  )
}

export default Login