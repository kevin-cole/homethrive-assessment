import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { getCurrentWeekday, formatDateInTimezone, convertToUTC } from './datetime'

const s3Client = new S3Client({})

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

type MedicationUpdate = Partial<Omit<Medication, 'id' | 'name' | 'dosage' | 'inactive_at' | 'created_at' | 'updated_at'>> & {
  markInactive?: boolean
}
type MedicationCreate = Partial<Omit<Medication, 'id' | 'created_at' | 'updated_at'>>

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

export class DatabaseManager {
  private SQL!: SqlJsStatic
  private db!: SqlJsDatabase
  private databasePath: string
  private bucketName: string

  constructor() {
    if (!process.env.DATABASE_PATH || !process.env.DATABASE_BUCKET_NAME) {
      throw new Error(
        `Environment variables are not set db path: ${process.env.DATABASE_PATH} bucket name: ${process.env.DATABASE_BUCKET_NAME}`
      )
    }
    this.databasePath = process.env.DATABASE_PATH
    this.bucketName = process.env.DATABASE_BUCKET_NAME
  }

  static async create() {
    console.log('creating database manager')
    const instance = new DatabaseManager()
    console.log('initializing database')
    await instance.initializeDatabase()
    console.log('initializing tables')
    await instance.initializeTables()
    console.log('seeding database')
    await instance.seed()
    console.log('database manager created')
    return instance
  }

  public async initializeDatabase() {
    console.log('initializing database')
    console.log('loading sql-wasm.wasm for initSqlJs from directory', process.cwd())
    this.SQL = await initSqlJs({
      locateFile: file => path.resolve(process.cwd(), 'sql-wasm.wasm'),
    })

    let filebuffer: Uint8Array | null = null

    if (!existsSync(this.databasePath)) {
      console.log('reading file from s3', { bucket: this.bucketName, key: 'database.sqlite' })
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: 'database.sqlite',
        })
        const response = await s3Client.send(command)
        const databaseBuffer = await response.Body?.transformToByteArray()
        if (databaseBuffer) {
          console.log('database buffer found')
          writeFileSync(this.databasePath, Buffer.from(databaseBuffer))
          filebuffer = new Uint8Array(databaseBuffer)
        } else {
          console.log('no database file found in S3, creating new DB in memory')
        }
      } catch (e) {
        console.log('Error downloading DB from S3, creating new DB in memory', e)
      }
    } else {
      console.log('db path exists, reading local file')
      filebuffer = new Uint8Array(readFileSync(this.databasePath))
    }

    this.db = filebuffer ? new this.SQL.Database(filebuffer) : new this.SQL.Database()

    // PRAGMA foreign_keys is supported by sql.js with a pragma statement
    this.db.run('PRAGMA foreign_keys = ON')

    // There's no direct sqlite_version() function in sql.js; skip or hardcode
    console.log('SQLite (sql.js) initialized')
  }

  async initializeTables() {
    console.log('Initializing database tables')
    this.db.run(`
      CREATE TABLE IF NOT EXISTS care_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        timezone TEXT NOT NULL DEFAULT 'America/Denver',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_id INTEGER NOT NULL,
        recurrence TEXT CHECK(recurrence IN ('daily','weekly','none')),
        name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        instructions TEXT,
        start_at DATETIME NOT NULL,
        end_at DATETIME DEFAULT NULL,
        inactive_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipient_id) REFERENCES care_recipients (id)
      );

      CREATE TABLE IF NOT EXISTS medication_times (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INT NOT NULL,
        weekday TEXT CHECK(weekday IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')) NOT NULL,
        time TIME NOT NULL,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS medication_doses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        medication_times_id INTEGER NOT NULL,
        scheduled_at DATETIME NOT NULL,
        date DATE NOT NULL,
        time DATETIME NOT NULL,
        taken_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (medication_id) REFERENCES medications (id),
        FOREIGN KEY (medication_times_id) REFERENCES medication_times (id)
      );
    `)
  }

  async seed() {
    this.run('INSERT INTO care_recipients (id, name) VALUES (1, "Jane Doe") ON CONFLICT DO NOTHING')
  }

  // Save current DB state to file and sync to S3
  async syncToS3() {
    try {
      const data = this.db.export()
      writeFileSync(this.databasePath, Buffer.from(data))

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: 'database.sqlite',
        Body: Buffer.from(data),
      })

      await s3Client.send(command)
    } catch (error) {
      console.error('Error saving database to S3:', error)
      throw error
    }
  }

  async close() {
    // sql.js doesn't have a close method, so save DB to file and S3 before "closing"
    await this.syncToS3()
  }

  // Utility: helper to run SELECT queries and get all results as objects
  private all(sql: string, params: any[] = []): any[] {
    try {
      const stmt = this.db.prepare(sql)
      stmt.bind(params)
      const results = []
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      stmt.free()
      return results
    } catch (error) {
      console.error('Database all() error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  // Utility: helper to run SELECT queries and get a single row
  private get(sql: string, params: any[] = []): any | null {
    try {
      const stmt = this.db.prepare(sql)
      stmt.bind(params)
      const result = stmt.step() ? stmt.getAsObject() : null
      stmt.free()
      return result
    } catch (error) {
      console.error('Database get() error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  // Utility: helper to run INSERT/UPDATE/DELETE
  private run(sql: string, params: any[] = []): void {
    try {
      const stmt = this.db.prepare(sql)
      stmt.bind(params)
      stmt.step()
      stmt.free()
    } catch (error) {
      console.error('Database run() error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  // Care recipient operations
  async getAllCareRecipients(): Promise<CareRecipient[]> {
    return this.all('SELECT * FROM care_recipients ORDER BY name')
  }

  async getCareRecipientById(id: number): Promise<CareRecipient | null> {
    return this.get('SELECT * FROM care_recipients WHERE id = ?', [id])
  }

  async createCareRecipient(
    recipient: Omit<CareRecipient, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<{ id: number; recipient: CareRecipient }> {
    this.run('INSERT INTO care_recipients (name) VALUES (?)', [recipient.name])
    const row = this.get('SELECT * FROM care_recipients WHERE id = last_insert_rowid()')
    return {
      id: row.id,
      recipient: row,
    }
  }

  // Recipient medications
  async getMedication(medicationId: number): Promise<Medication | null> {
    return this.get('SELECT * FROM medications WHERE id = ?', [medicationId]) as Medication | null
  }

  async getRecipientMedications(recipientId: number): Promise<Medication[]> {
    return this.all('SELECT * FROM medications WHERE recipient_id = ? ORDER BY name', [recipientId])
  }

  async getRecipientMedicationById(recipientId: number, medicationId: number): Promise<Medication | null> {
    return this.get('SELECT * FROM medications WHERE id = ? AND recipient_id = ?', [medicationId, recipientId])
  }

  async getRecipientMedicationByName(recipientId: number, name: string): Promise<Medication | null> {
    return this.get('SELECT * FROM medications WHERE name = ? AND recipient_id = ?', [name, recipientId])
  }

  async createMedication(
    medication: MedicationCreate,
  ): Promise<Medication> {
    this.run(
      'INSERT INTO medications (name, dosage, recurrence, start_at, end_at, recipient_id) VALUES (?, ?, ?, ?, ?, ?)',
      [medication.name, medication.dosage,  medication.recurrence, medication.start_at, medication.end_at || null, medication.recipient_id]
    )
    const row = this.get('SELECT * FROM medications WHERE id = last_insert_rowid()')
    return row as Medication
  }

  async updateRecipientMedication(
    recipientId: number,
    medicationId: number,
    updates: MedicationUpdate,
  ): Promise<Medication> {
    if (typeof updates.markInactive === 'boolean') {
      if (updates.markInactive) {
        this.run(
          'UPDATE medications SET inactive_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE recipient_id = ? AND id = ?',
          [recipientId, medicationId]
        )
      } else {
        this.run(
          'UPDATE medications SET inactive_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE recipient_id = ? AND id = ?',
          [recipientId, medicationId]
        )
      }
    }
    this.run(
      'UPDATE medications SET updated_at = CURRENT_TIMESTAMP WHERE recipient_id = ? AND id = ?',
      [ recipientId, medicationId]
    )
    const row = this.get('SELECT * FROM medications WHERE id = ? AND recipient_id = ?', [medicationId, recipientId])
    return row as Medication
  }

  // Medication times
  async createMedicationTimes(medicationId: number, times: MedicationTime[]): Promise<MedicationTime[]> {
    times.forEach(time => {
      this.run(
        'INSERT INTO medication_times (medication_id, weekday, time) VALUES (?, ?, ?)',
        [medicationId, time.weekday, time.time]
      )
    })
    const createdTimes = this.all('SELECT * FROM medication_times WHERE medication_id = ?', [medicationId])
    return createdTimes
  }

  async getMedicationTimes(medicationId: number): Promise<MedicationTime[]> {
    return this.all('SELECT * FROM medication_times WHERE medication_id = ?', [medicationId])
  }

  // Dose operations
  async insertDosesFromMedication(medicationId: number, dayCount: number): Promise<MedicationDose[]> {
    // Get the medication to find the recipient_id
    const medication = await this.getMedication(medicationId)
    if (!medication) {
      throw new Error('Medication not found')
    }

    // Get the recipient timezone
    const recipient = await this.getCareRecipientById(medication.recipient_id)
    if (!recipient) {
      throw new Error('Recipient not found')
    }

    // Get all medication times for this medication
    const medicationTimes = await this.getMedicationTimes(medicationId)

    const doses: any[] = []

        // Loop through each day from today to dayCount
    Array.from({ length: dayCount }, (_, dayOffset) => {
      // Calculate the date for this day
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + dayOffset)

      // Get the weekday for this date in recipient's timezone
      const weekday = getCurrentWeekday(recipient.timezone, targetDate)

      // Find medication times for this weekday
      const timesForDay = medicationTimes.filter(time => time.weekday === weekday)

            // Create doses for each time on this day
      timesForDay.forEach(time => {
        // Get the date in recipient's timezone
        const recipientDate = formatDateInTimezone(targetDate, recipient.timezone) // Returns YYYY-MM-DD format

                // Create datetime by combining recipient's date with time
        const dateTimeString = `${recipientDate}T${time.time}:00`

        // Convert to UTC using proper timezone conversion
        const utcDateTime = convertToUTC(dateTimeString, recipient.timezone)

        doses.push({
          medication_id: medicationId,
          medication_times_id: time.id,
          scheduled_at: utcDateTime,
          date: recipientDate, // Date in recipient's timezone
          time: time.time,
          taken_at: null
        })
      })
    })
    // Insert all doses into database
    doses.forEach(dose => {
      this.run(
        'INSERT INTO medication_doses (medication_id, medication_times_id, scheduled_at, date, time, taken_at) VALUES (?, ?, ?, ?, ?, ?)',
        [dose.medication_id, dose.medication_times_id, dose.scheduled_at, dose.date, dose.time, dose.taken_at]
      )
    })

    const savedDoses = await this.getDosesForMedication(medicationId)
    console.log('savedDoses', savedDoses)

    return savedDoses
  }

  async getDosesForMedication(medicationId: number): Promise<MedicationDose[]> {
    return this.all('SELECT * FROM medication_doses WHERE medication_id = ?', [medicationId])
  }

  async getMedicationDoses(recipientId: number, medicationId: number): Promise<MedicationDose[]> {
    // First verify the medication belongs to the recipient
    const medication = await this.getRecipientMedicationById(recipientId, medicationId)
    if (!medication) {
      throw new Error('Medication not found for this recipient')
    }

    // Get doses for the medication
    return this.all(`
      SELECT md.*, m.name as medication_name, m.dosage
      FROM medication_doses md
      JOIN medications m ON md.medication_id = m.id
      WHERE md.medication_id = ? AND m.recipient_id = ?
      ORDER BY md.scheduled_at
    `, [medicationId, recipientId])
  }


    async getUpcomingDoses(recipientId: number, period: 'daily' | 'weekly' = 'daily'): Promise<MedicationDose[]> {
    // Get recipient timezone
    const recipient = await this.getCareRecipientById(recipientId)
    if (!recipient) {
      throw new Error('Recipient not found')
    }

    // Get current date in recipient's timezone
    const now = new Date()
    const recipientToday = formatDateInTimezone(now, recipient.timezone, 'yyyy-MM-dd')

    let startDate: string
    let endDate: string

        if (period === 'daily') {
      // Get doses for today only in recipient's timezone
      const startDateTime = convertToUTC(`${recipientToday}T00:00:00`, recipient.timezone)
      const endDateTime = convertToUTC(`${recipientToday}T23:59:59`, recipient.timezone)
      startDate = startDateTime
      endDate = endDateTime
    } else {
      // Get doses for the next 7 days in recipient's timezone
      const endDateInRecipientTz = new Date(recipientToday)
      endDateInRecipientTz.setDate(endDateInRecipientTz.getDate() + 7)
      const endDateStr = formatDateInTimezone(endDateInRecipientTz, recipient.timezone, 'yyyy-MM-dd')

      const startDateTime = convertToUTC(`${recipientToday}T00:00:00`, recipient.timezone)
      const endDateTime = convertToUTC(`${endDateStr}T23:59:59`, recipient.timezone)
      startDate = startDateTime
      endDate = endDateTime
    }

    const query = `
      SELECT md.*, m.name as medication_name, m.dosage, mt.weekday
      FROM medication_doses md
      JOIN medications m ON md.medication_id = m.id
      JOIN medication_times mt ON md.medication_times_id = mt.id
      WHERE md.scheduled_at >= ?
      AND md.scheduled_at <= ?
      AND m.inactive_at IS NULL
      AND m.recipient_id = ?
      ORDER BY md.scheduled_at
    `
    const doses = await this.all(query, [startDate, endDate, recipientId])

    const formattedDoses = doses.map(dose => ({
      ...dose,
      scheduled_at: formatDateInTimezone(
        new Date(dose.scheduled_at),
        recipient.timezone,
        "yyyy-MM-dd'T'HH:mm:ss"
      ),
    }))
    return formattedDoses
  }

  async markDoseAsTaken(doseId: number): Promise<void> {
    this.run(
      'UPDATE medication_doses SET taken_at = CURRENT_TIMESTAMP WHERE id = ?',
      [doseId]
    )
  }
}

export const createDatabaseManager = async (): Promise<DatabaseManager> => {
  return DatabaseManager.create()
}
