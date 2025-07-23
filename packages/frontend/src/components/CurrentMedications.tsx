import { medicationsApi } from '@/services/api'
import { useQuery } from '@tanstack/react-query'
import { useRecipient } from '@/context/RecipientContext'
import { useNavigate } from 'react-router-dom'
import { Pill, Clock, Calendar, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const CurrentMedications = () => {
  const { recipient } = useRecipient()
  const navigate = useNavigate()
  const [showInactive, setShowInactive] = useState(false)

  if (!recipient) {
    return <div>Loading recipient...</div>
  }

  const { data: allMedications = [], isLoading } = useQuery({
    queryKey: ['medications', recipient.id],
    queryFn: () => medicationsApi.getByRecipient(recipient.id),
    retry: false,
    retryOnMount: false,
  })

    // Filter medications based on showInactive toggle
  const medications = showInactive
    ? allMedications
    : allMedications.filter(med => med.inactive_at === null)

  const handleMedicationClick = (medicationId: number) => {
    navigate(`/medications/${medicationId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getRecurrenceIcon = (recurrence: string) => {
    switch (recurrence.toLowerCase()) {
      case 'daily':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'weekly':
        return <Calendar className="h-4 w-4 text-green-500" />
      default:
        return <Pill className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading medications...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Current Medications
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-3 py-1 text-sm rounded flex items-center gap-2 ${
              showInactive
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
          <button
            onClick={() => navigate('/medications/add')}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Add Medication
          </button>
        </div>
      </div>

      {!medications || medications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No medications found</p>
          <button
            onClick={() => navigate('/medications/add')}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Add your first medication
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {medications.map((medication) => (
            <div
              key={medication.id}
              onClick={() => handleMedicationClick(medication.id!)}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                medication.inactive_at ? 'bg-gray-50 opacity-75' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 truncate">
                    {medication.name}
                  </h3>
                  {medication.inactive_at && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                {getRecurrenceIcon(medication.recurrence)}
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {medication.dosage}
              </p>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Started: {formatDate(medication.start_at)}</span>
                </div>

                {medication.end_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Ends: {formatDate(medication.end_at)}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="capitalize">{medication.recurrence}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CurrentMedications