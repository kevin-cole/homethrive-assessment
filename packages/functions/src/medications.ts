import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { createDatabaseManager, DatabaseManager } from './utils/database'
import { NotFound, MethodNotAllowed, BadRequest, Ok, Created, InternalServerError } from './utils/responses'
import { withAuth } from './utils/auth'

export const handler: APIGatewayProxyHandlerV2 = withAuth(async (event, payload) => {
  const { pathParameters, body } = event
  const httpMethod = event.requestContext.http.method

  let db: DatabaseManager | undefined
  try {
    db = await createDatabaseManager()

    const recipientId = pathParameters?.recipient_id ? parseInt(pathParameters?.recipient_id) : undefined
    if (!recipientId || isNaN(recipientId)) {
      return MethodNotAllowed()
    }

        switch (httpMethod) {
      case 'GET':
        if (pathParameters?.medication_id) {
          const medicationId = parseInt(pathParameters?.medication_id)
          if (isNaN(medicationId)) {
            return BadRequest('Medication ID is required')
          }

          // Check if this is the schedule endpoint for a specific medication
          if (event.rawPath.endsWith('/schedule')) {
            const schedules = await db.getMedicationTimes(medicationId)
            return Ok(schedules)
          }

          // Get single medication
          const medication = await db.getRecipientMedicationById(recipientId, medicationId)
          if (!medication) {
            return NotFound('Medication not found')
          }

          return Ok(medication)
        } else {
          const medications = await db.getRecipientMedications(recipientId)
          return Ok(medications)
        }

      case 'POST':

        if (!body) {
          return BadRequest('Body is required')
        }

        const {
          name,
          dosage,
          recurrence,
          start_at,
          end_at,
          schedule
        } = JSON.parse(body || '{}')

        if (!name || !dosage) {
          return BadRequest('Name, dosage and schedule are required')
        }

        if (!schedule || schedule.length === 0) {
          return BadRequest('A schedule is required')
        }

        const newMedication = {
          name,
          dosage,
          recurrence,
          start_at,
          end_at,
          schedule,
          recipient_id: recipientId,
        }

        // Do not allow duplicate active medication names
        const existingMedication = await db.getRecipientMedicationByName(recipientId, name)
        if (existingMedication && !existingMedication.inactive_at) {
          return BadRequest('An active medication with this name already exists')
        }

        // Create medication
        console.log('creating medication', newMedication)
        const medication = await db.createMedication(newMedication)

        // Create medication times
        const medicationTimes = schedule.map((time: any) => ({
          medication_id: medication.id,
          weekday: time.weekday,
          time: time.time,
        }))
        console.log('creating medication times', medicationTimes)
        await db.createMedicationTimes(medication.id as number, medicationTimes)

        // TODO move to event/pub sub
        // Insert doses for the medication
        await db.insertDosesFromMedication(medication.id as number, 7)

        // Save database to S3
        await db.syncToS3()

        return Created(medication)

      case 'PUT':
        // We only support deactivation
        const medicationId = pathParameters?.medication_id ? parseInt(pathParameters?.medication_id) : undefined
        if (!medicationId || isNaN(medicationId)) {
          return BadRequest('Medication ID is required')
        }

        // select the medication first to validate existence
        const currentMedication = await db.getRecipientMedicationById(recipientId, medicationId)
        if (!currentMedication) {
          return NotFound('Medication not found')
        }

        const {
          mark_inactive: markInactive
        } = JSON.parse(body || '{}')

        const updatedMedication = db.updateRecipientMedication(recipientId, medicationId, {
          markInactive
        })
        // Save database to S3
        await db.syncToS3()

        return Ok(updatedMedication)

      default:
        return MethodNotAllowed()
    }
  } catch (error) {
    console.error('Error:', error)
    return InternalServerError('Internal server error', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    if (db) await db.close()
  }
})
