import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { createDatabaseManager } from './utils/database'
import { MethodNotAllowed, Ok, BadRequest, InternalServerError } from './utils/responses'
import { withAuth } from './utils/auth'

export const handler: APIGatewayProxyHandlerV2 = withAuth(async (event, payload) => {
  const { pathParameters } = event
  const httpMethod = event.requestContext.http.method

  let db: any
  try {
    db = await createDatabaseManager()

    switch (httpMethod) {
      case 'GET':
        // Disambiguate between the two GET routes
        const recipientId = pathParameters?.recipient_id
        const medicationId = pathParameters?.medication_id

        if (recipientId && medicationId) {
          // Route: GET /recipients/{recipient_id}/medications/{medication_id}/doses
          // Get doses for a specific medication
          const doses = await db.getMedicationDoses(
            parseInt(recipientId),
            parseInt(medicationId)
          )

          return Ok(doses)

        } else if (recipientId) {
          // Route: GET /recipients/{recipient_id}/doses
          // Get all upcoming doses for a recipient
          const period = event.queryStringParameters?.period as 'daily' | 'weekly' || 'daily'

          const doses = await db.getUpcomingDoses(
            parseInt(recipientId),
            period,
          )

          return Ok(doses)

        } else {
          // No recipient_id provided
          return BadRequest('Recipient ID is required')
        }

      case 'PUT':
        // Route: PUT /recipients/{recipient_id}/doses/{dose_id}/take
        // Mark dose as taken
        const doseId = pathParameters?.dose_id
        if (!doseId) {
          return BadRequest('Dose ID is required')
        }

        await db.markDoseAsTaken(parseInt(doseId))

        // Save database to S3
        await db.syncToS3()

        return Ok({ message: 'Dose marked as taken successfully' })

      default:
        return MethodNotAllowed()
    }
  } catch (error) {
    console.error('Error:', error)
    return InternalServerError(error instanceof Error ? error.message : 'Unknown error')
  } finally {
    if (db) await db.close()
  }
})
