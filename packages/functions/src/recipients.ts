import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { createDatabaseManager } from './utils/database'
import { NotFound, MethodNotAllowed, Ok, BadRequest, Created, InternalServerError } from './utils/responses'
import { withAuth } from './utils/auth'

export const handler: APIGatewayProxyHandlerV2 = withAuth(async (event, payload) => {
  const { pathParameters, body, requestContext } = event
  const httpMethod = requestContext.http.method

  let db: any
  try {
    db = await createDatabaseManager()

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.recipient_id) {
          // Get single recipient
          const recipient = await db.getCareRecipientById(parseInt(pathParameters.recipient_id))
          console.log('recipient', recipient)
          if (!recipient) {
            return NotFound('Recipient not found')
          }

          return Ok(recipient)
        } else {
          // Get all recipients
          const recipients = await db.getAllCareRecipients()

          return Ok(recipients)
        }

      case 'POST':
        // Create new recipient
        const recipientData = JSON.parse(body || '{}')
        const { name } = recipientData

        if (!name) {
          return BadRequest('Name is required')
        }

        const recipient = await db.createCareRecipient({ name })

        // Save database to S3
        await db.syncToS3()

        return Created(recipient)

      default:
        return MethodNotAllowed()
    }
  } catch (error) {
    console.error('Error:', error)
    await new Promise((res) => setTimeout(res, 1000)) // Allow logs to flush
    return InternalServerError(error instanceof Error ? error.message : 'Unknown error')
  } finally {
    if (db) await db.close()
  }
})
