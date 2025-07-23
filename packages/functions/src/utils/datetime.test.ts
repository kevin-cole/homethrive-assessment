import { formatDateInTimezone, convertToUTC } from './datetime'

describe('datetime utils', () => {
  it('formats date in timezone correctly', () => {
    const date = new Date('2025-07-23T14:00:00Z') // 2025-07-23 14:00 UTC
    // America/Chicago is UTC-5 in July (CDT)
    const formatted = formatDateInTimezone(date, 'America/Chicago', "yyyy-MM-dd HH:mm")
    expect(formatted).toBe('2025-07-23 09:00')
  })

  it('converts local time in timezone to UTC ISO string', () => {
    // 8:00 AM in America/Chicago should be 13:00 UTC in July
    const localTime = '2025-07-23T08:00:00'
    const utc = convertToUTC(localTime, 'America/Chicago')
    expect(utc).toBe('2025-07-23T13:00:00.000Z')
  })
})