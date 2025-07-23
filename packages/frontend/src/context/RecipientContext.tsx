import React, { createContext, useContext, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { recipientsApi} from '@/services/api'
import { CareRecipient } from '@/types'

type RecipientContextType = {
  recipient: CareRecipient | undefined
  isLoading: boolean
  error: unknown
}

const RecipientContext = createContext<RecipientContextType | undefined>(undefined)

export const RecipientProvider = ({ children }: { children: ReactNode }) => {
  const { data: recipient, isLoading, error } = useQuery({
    queryKey: ['recipient', 1],
    queryFn: () => recipientsApi.getById(1),
    suspense: true,
    retry: false, // Don't retry on failure
    retryOnMount: false, // Don't retry when component mounts
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    enabled: !!localStorage.getItem('jwt'), // Only run query if token exists
  })

  return (
    <RecipientContext.Provider value={{ recipient, isLoading, error }}>
      {children}
    </RecipientContext.Provider>
  )
}

export const useRecipient = () => {
  const context = useContext(RecipientContext)
  if (!context) {
    throw new Error('useRecipient must be used within a RecipientProvider')
  }
  return context
}