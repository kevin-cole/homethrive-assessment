import UpcomingDoses from '@/components/UpcomingDoses'
import CurrentMedications from '@/components/CurrentMedications'

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of medications</p>
      </div>

      <UpcomingDoses />
      <CurrentMedications />
    </div>
  )
}

export default Dashboard
