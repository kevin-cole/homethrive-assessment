export type CareRecipient = {
  id: number
  name: string
  timezone: string
  date_of_birth?: string
  created_at: string
  updated_at: string
}

export type Medication = {
  id?: number
  recipient_id: number
  name: string
  dosage: string
  start_at: string
  end_at?: string
  recurrence: string
  inactive_at: string | null
  created_at?: string
  updated_at?: string
  schedule: MedicationSchedule[]
}

export type MedicationSchedule = {
  id: number
  medication_id: number
  weekday: string
  time: string
  created_at: string
}

export type MedicationDose = {
  id: number
  medication_id: number
  medication_name: string
  dosage: string
  weekday: string
  scheduled_at: string
  taken_at?: string
  created_at: string
}