import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { createDatabaseManager } from './utils/database'
import { NotFound, MethodNotAllowed } from './utils/responses'
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

          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipient),
          }
        } else {
          // Get all recipients
          const recipients = await db.getAllCareRecipients()

          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipients),
          }
        }

      case 'POST':
        // Create new recipient
        const recipientData = JSON.parse(body || '{}')
        const { name } = recipientData

        if (!name) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Name is required' }),
          }
        }

        const recipient = await db.createCareRecipient({ name })

        // Save database to S3
        await db.syncToS3()

        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recipient),
        }

      default:
        return MethodNotAllowed()
    }
  } catch (error) {
    console.error('Error:', error)
    await new Promise((res) => setTimeout(res, 1000)) // Allow logs to flush
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  } finally {
    if (db) await db.close()
  }
})
