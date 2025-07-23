// MedicationScheduleForm.tsx
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, Plus, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/Card"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { RECURRENCE, WEEKDAYS } from "@/enumerations"
import { medicationsApi } from '@/services/api'
import { useRecipient } from '@/context/RecipientContext'
import { useQueryClient } from '@tanstack/react-query'
import { Medication } from '@/types'

type DailySchedule = string[]
type WeeklySchedule = Array<
  {
    weekday: WEEKDAYS,
    times: string[]
  }
>

const days = Object.values(WEEKDAYS)

const AddMedication = () => {
  const { recipient } = useRecipient()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  if (!recipient) {
    return <div>Loading recipient...</div>
  }
  const [medication, setMedication] = useState<Medication>({
    recipient_id: recipient.id!,
    name: '',
    dosage: '',
    recurrence: RECURRENCE.DAILY,
    start_at: (new Date()).toISOString(),
    inactive_at: null,
    schedule: []
  })
  const [dailySchedule, setDailySchedule] = useState<DailySchedule>([])
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(
    days.map(day => ({ weekday: day, times: [] }))
  )

  const handleSave = async () => {
    const schedule = medication.recurrence === RECURRENCE.DAILY
      ? days.flatMap(day =>
        dailySchedule.map(s => ({
          weekday: day,
          time: s,
        }))
      )
      : weeklySchedule.filter(dayTime => dayTime.times.length > 0).flatMap(dayTime =>
        dayTime.times.map(time => ({
          weekday: dayTime.weekday,
          time,
        }))
      )

    const normalizedMedications = {
      name: medication.name,
      dosage: medication.dosage,
      recurrence: medication.recurrence,
      start_at: medication.start_at,
      end_at: medication.end_at,
      schedule
    }

    try {
      await medicationsApi.create(recipient.id!, normalizedMedications)

      // Invalidate and refetch related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['medications', recipient.id] }),
        queryClient.invalidateQueries({ queryKey: ['doses', recipient.id] }),
      ])

      navigate('/')
    } catch (error) {
      console.error('Failed to create medication:', error)
      // You could add a toast notification here
    }
  }


  const updateMedication = (updated: Partial<Medication>) => {
    setMedication({ ...medication, ...updated })
  }

  const addDailyTime = () => {
    console.log('adding daily time')
    const newTime = dailySchedule.length === 0 ? '08:00' : dailySchedule[dailySchedule.length - 1]
    setDailySchedule([...dailySchedule, newTime])
  }

  const updateDailyTime = (idx: number, value: string) => {
    setDailySchedule(prev =>
      prev.map((time, i) => (i === idx ? value : time))
    )
  }

  const removeDailyTime = (idx: number) => {
    setDailySchedule(dailySchedule.filter((_, i) => i !== idx))
  }

  const addWeeklyTime = (day: WEEKDAYS) => {
    setWeeklySchedule(prev =>
      prev.map(obj =>
        obj.weekday === day
          ? {
              ...obj,
              times: [
                ...obj.times,
                obj.times.length === 0 ? '08:00' : obj.times[obj.times.length - 1]
              ]
            }
          : obj
      )
    )
  }

  const updateWeeklyTime = (day: WEEKDAYS, idx: number, value: string) => {
    setWeeklySchedule(prev =>
      prev.map(obj =>
        obj.weekday === day
          ? {
              ...obj,
              times: obj.times.map((t, i) => (i === idx ? value : t))
            }
          : obj
      )
    )
  }

  const removeWeeklyTime = (day: WEEKDAYS, idx: number) => {
    setWeeklySchedule(prev =>
      prev.map(obj =>
        obj.weekday === day
          ? {
              ...obj,
              times: obj.times.filter((_, i) => i !== idx)
            }
          : obj
      )
    )
  }

  const DailyScheduleComponent = () => {
    return (
      <div>
        <Label>Times (Every day)</Label>
        {dailySchedule.map((t, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              type="time"
              value={t}
              onChange={e => updateDailyTime(idx, e.target.value)}
            />
            <Button variant="ghost" size="icon" onClick={() => removeDailyTime(idx)}>
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={addDailyTime} className="mt-1">
          <Plus size={14} className="mr-1" /> Add Time
        </Button>
      </div>
    )
  }

  const WeeklyScheduleComponent = () => {
    return (
      <div>
        <Label>Weekly Schedule</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {weeklySchedule.map((day) => (
            <div key={day.weekday} className="flex flex-col items-center min-w-0">
              <span className="font-semibold mb-2">{day.weekday}</span>
              {(day.times || []).map((t, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-1 w-full">
                  <Input
                    type="time"
                    value={t}
                    onChange={e => updateWeeklyTime(day.weekday, idx, e.target.value)}
                    className="w-full text-xs sm:text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWeeklyTime(day.weekday, idx)}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addWeeklyTime(day.weekday)}
                className="mt-1 w-full text-xs sm:text-sm"
              >
                <Plus size={12} className="mr-1 sm:w-3.5 sm:h-3.5" /> Add Time
              </Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-2 md:p-0">
      <Card className="space-y-2">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
          <CardTitle className="text-base">Add Medication for {recipient.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                className="w-full"
                value={medication.name}
                onChange={(e) => updateMedication({ name: e.target.value })}
              />
            </div>
            <div>
              <Label>Dosage</Label>
              <Input
                className="w-full"
                value={medication.dosage}
                onChange={(e) => updateMedication({ dosage: e.target.value })}
              />
            </div>
            <div>
              <Label>Schedule Type</Label>
              <select
                className="border rounded px-2 py-2 w-full"
                value={medication.recurrence}
                onChange={(e) => updateMedication({ recurrence: e.target.value as WEEKDAYS })}
              >
                <option value={RECURRENCE.DAILY}>{RECURRENCE.DAILY}</option>
                <option value={RECURRENCE.WEEKLY}>{RECURRENCE.WEEKLY}</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Schedule</Label>
            <div className="space-y-3">
            {medication.recurrence === RECURRENCE.DAILY && <DailyScheduleComponent />}
            {medication.recurrence === RECURRENCE.WEEKLY && (
              <div className="overflow-x-auto">
                <WeeklyScheduleComponent />
              </div>
            )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                icon={<Calendar size={14} />}
                className="w-full"
                value={medication.start_at}
                onChange={(e) => updateMedication({ start_at: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                icon={<Calendar size={14} />}
                className="w-full"
                value={medication.end_at}
                onChange={(e) => updateMedication({ end_at: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full md:w-auto" onClick={handleSave}>Save</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default AddMedication
