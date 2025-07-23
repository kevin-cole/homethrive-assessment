export type Medication = {
  id?: number
  recipient_id: number
  name: string
  dosage: string
  instructions: string | null
  recurrence: string
  start_at: string
  end_at: string
  created_at?: string | null
  updated_at?: string | null
  inactive_at?: string | null
}

export type MedicationTime = {
  id?: number
  medication_id: number
  weekday: string
  time: string
}

export type MedicationUpdate = Partial<Omit<Medication, 'id' | 'name' | 'dosage' | 'inactive_at' | 'created_at' | 'updated_at'>> & {
  markInactive?: boolean
}
export type MedicationCreate = Partial<Omit<Medication, 'id' | 'created_at' | 'updated_at'>>

export type MedicationDose = {
  id?: number
  medication_id: number
  schedule_date: string
  schedule_time: string // HH:MM
  taken_at: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type CareRecipient = {
  id?: number
  name: string
  timezone: string
  created_at?: string | null
  updated_at?: string | null
}