import { jwtDecode } from 'jwt-decode'

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true
  try {
    const { exp } = jwtDecode<{ exp: number }>(token)
    if (!exp) return true
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

export const fetchNewToken = async (): Promise<string> => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, { method: "POST" })
  const data = await res.json()
  return data.token
}

export const getToken = async (): Promise<string | null> => {
  const token = localStorage.getItem("jwt")
  if (isTokenExpired(token)) {
    return fetchNewToken()
  }
  return token
}