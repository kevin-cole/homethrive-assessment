import { dosesApi } from '@/services/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useRecipient } from '@/context/RecipientContext'

const UpcomingDoses = () => {
  const { recipient } = useRecipient()
  const queryClient = useQueryClient()

  if (!recipient) {
    return <div>Loading recipient...</div>
  }

  const { data: doses = [], isLoading: dosesLoading } = useQuery({
    queryKey: ['doses', recipient.id],
    queryFn: () => dosesApi.getUpcoming(recipient.id, 'daily'),
    retry: false,
    retryOnMount: false,
  })

  const markAsTaken = useMutation({
    mutationFn: (doseId: number) => dosesApi.markAsTaken(recipient.id, doseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doses', recipient.id] })
    },
  })

  const getStatusIcon = (dose: any) => {
    if (dose.taken_at) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }

    const scheduledTime = new Date(dose.scheduled_at)
    const now = new Date()

    if (scheduledTime < now) {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }

    return <Clock className="h-5 w-5 text-blue-500" />
  }

  const getStatusText = (dose: any) => {
    if (dose.taken_at) {
      return 'Taken'
    }

    const scheduledTime = new Date(dose.scheduled_at)
    const now = new Date()

    if (scheduledTime < now) {
      return 'Overdue'
    }

    return 'Upcoming'
  }

  const getStatusColor = (dose: any) => {
    if (dose.taken_at) {
      return 'bg-green-100 text-green-800'
    }

    const scheduledTime = new Date(dose.scheduled_at)
    const now = new Date()

    if (scheduledTime < now) {
      return 'bg-red-100 text-red-800'
    }

    return 'bg-blue-100 text-blue-800'
  }

  if (dosesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading doses...</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Upcoming Medication Doses
        </h2>
      </div>
      {!doses || doses.length === 0 ? (
        <div>No doses scheduled.</div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full border mb-8 text-xs md:text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Day</th>
                <th className="border px-2 py-1">Time</th>
                <th className="border px-2 py-1">Medication</th>
                <th className="border px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {doses.map((dose: any) => (
                <tr key={dose.id}>
                  <td className="border px-2 py-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(dose)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dose)}`}>
                        {getStatusText(dose)}
                      </span>
                    </div>
                  </td>
                  <td className="border px-2 py-1">{dose.weekday}</td>
                  <td className="border px-2 py-1">{
                    dose.time
                      ? new Date(`1970-01-01T${dose.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                      : new Date(dose.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
                  }</td>
                  <td className="border px-2 py-1">{dose.medication_name}</td>
                  <td className="border px-2 py-1">
                    {!dose.taken_at && (
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50 w-full md:w-auto"
                        onClick={() => markAsTaken.mutate(dose.id)}
                        disabled={markAsTaken.isLoading}
                      >
                        Mark as Taken
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UpcomingDoses