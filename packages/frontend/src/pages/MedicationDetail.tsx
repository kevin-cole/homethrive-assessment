import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRecipient } from '@/context/RecipientContext'
import { medicationsApi, medicationSchedulesApi } from '@/services/api'
import { ArrowLeft, Trash2, Calendar, Clock, Pill, RefreshCw } from 'lucide-react'

const MedicationDetail = () => {
  const { medicationId } = useParams<{ medicationId: string }>()
  const navigate = useNavigate()
  const { recipient } = useRecipient()
  const queryClient = useQueryClient()

  if (!recipient || !medicationId) {
    return <div>Loading...</div>
  }

  const { data: medication, isLoading, error, refetch } = useQuery({
    queryKey: ['medication', recipient.id, medicationId],
    queryFn: () => medicationsApi.getById(recipient.id, parseInt(medicationId)),
    retry: false,
    retryOnMount: false,
  })

  const { data: medicationSchedule } = useQuery({
    queryKey: ['medicationSchedule', recipient.id, medicationId],
    queryFn: () => medicationSchedulesApi.getByMedication(recipient.id, parseInt(medicationId)),
    retry: false,
    retryOnMount: false,
  })

  const markInactive = async () => {
    if (!medication || !medicationId) return

    try {
      await medicationsApi.markInactive(recipient.id, parseInt(medicationId))

      // Invalidate and refetch related queries
      await queryClient.invalidateQueries({ queryKey: ['medications', recipient.id] })
      await queryClient.invalidateQueries({ queryKey: ['medication', recipient.id, medicationId] })

      // Navigate back to dashboard
      navigate('/')
    } catch (error) {
      console.error('Failed to archive medication:', error)
      // You could add a toast notification here
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getRecurrenceIcon = (recurrence: string) => {
    switch (recurrence.toLowerCase()) {
      case 'daily':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'weekly':
        return <Calendar className="h-5 w-5 text-green-500" />
      default:
        return <Pill className="h-5 w-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading medication details...</div>
      </div>
    )
  }

  if (error || !medication) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading medication details</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{medication.name}</h1>
            <p className="text-gray-600">Medication Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
          <button
            onClick={markInactive}
            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Archive
          </button>
        </div>
      </div>

      {/* Medication Details */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Medication Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{medication.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Dosage</label>
              <p className="text-gray-900">{medication.dosage}</p>
            </div>
          </div>

          {/* Schedule Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getRecurrenceIcon(medication.recurrence)}
              <div>
                <label className="text-sm font-medium text-gray-500">Frequency</label>
                <p className="text-gray-900 capitalize">{medication.recurrence}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Start Date</label>
              <p className="text-gray-900">{formatDate(medication.start_at)}</p>
            </div>
            {medication.end_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">End Date</label>
                <p className="text-gray-900">{formatDate(medication.end_at)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Schedule Overview */}
      {medicationSchedule && medicationSchedule.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Overview</h2>
          <div className="grid gap-4 md:grid-cols-7">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const daySchedule = medicationSchedule.filter((s: any) => s.weekday === day)
              return (
                <div key={day} className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">{day}</h3>
                  {daySchedule.length > 0 ? (
                    <div className="space-y-1">
                      {daySchedule.map((schedule: any, index: number) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          {new Date(`1970-01-01T${schedule.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No doses</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicationDetail