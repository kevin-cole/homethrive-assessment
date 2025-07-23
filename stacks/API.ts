import { StackContext, Api, use } from 'sst/constructs'
import { Storage } from './Storage'

export function API({ stack }: StackContext) {
  const { bucket } = use(Storage)
  // Create the API
  const api = new Api(stack, 'homethrive-assessment-api', {
    defaults: {
      function: {
        bind: [bucket],
        environment: {
          DATABASE_PATH: '/tmp/database.sqlite',
          DATABASE_BUCKET_NAME: bucket.bucketName,
          DEV_JWT_SECRET: 'your-256-bit-secret',
        },
      },
    },
    cors: {
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowOrigins: ["*"],
      allowHeaders: ["*"],
    },
    routes: {
      // login
      'POST /login': 'packages/functions/src/login.handler',
      // Care recipients
      'GET /recipients/{recipient_id}': 'packages/functions/src/recipients.handler',
      // Medications
      'GET /recipients/{recipient_id}/medications': 'packages/functions/src/medications.handler',
      'GET /recipients/{recipient_id}/medications/{medication_id}/schedule': 'packages/functions/src/medications.handler',
      'POST /recipients/{recipient_id}/medications': 'packages/functions/src/medications.handler',
      'GET /recipients/{recipient_id}/medications/{medication_id}': 'packages/functions/src/medications.handler',
      'PUT /recipients/{recipient_id}/medications/{medication_id}': 'packages/functions/src/medications.handler',
      // Doses
      'GET /recipients/{recipient_id}/doses': 'packages/functions/src/doses.handler',
      'PUT /recipients/{recipient_id}/doses/{dose_id}/take': 'packages/functions/src/doses.handler',
      //'GET /recipients/{recipient_id}/medications/{medication_id}/doses': 'packages/functions/src/doses.handler',
    },
  })

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
  })

  return api
}


