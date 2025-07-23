import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz'

// Get current weekday in a specific timezone
export const getCurrentWeekday = (timezone: string = 'America/Denver', date: Date = new Date()): string => {
  const weekday = formatInTimeZone(date, timezone, 'EEEE') // 'EEEE' = full weekday name
  return weekday
}

export const createDateTimeInTimezone = (time: string, timezone: string = 'America/Denver'): Date => {
  // Get current date in recipient's timezone
  const today = new Date().toLocaleDateString('en-US', {
    timeZone: timezone
  })

  // Combine date with time
  const dateTimeString = `${today} ${time}`

  // Create a date object in the recipient's timezone
  const localDateTime = new Date(dateTimeString + ' ' + timezone)

  // Convert to UTC
  const utcDateTime = new Date(localDateTime.toLocaleString('en-US', { timeZone: 'UTC' }))

  return utcDateTime
}

// Helper to format date in timezone
export const formatDateInTimezone = (date: Date, timezone: string, format: string = 'yyyy-MM-dd'): string => {
  return formatInTimeZone(date, timezone, format)
}

// Helper to convert datetime string in timezone to UTC
export const convertToUTC = (dateTimeString: string, timezone: string): string => {
  // Interpret dateTimeString as being in the given timezone, then convert to UTC
  const utcDate = zonedTimeToUtc(dateTimeString, timezone)
  return utcDate.toISOString()
}
