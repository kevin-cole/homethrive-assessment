import jwt from 'jsonwebtoken'
import { APIGatewayProxyHandlerV2 } from 'aws-lambda'

const SECRET = process.env.DEV_JWT_SECRET || ''

export function verifyJwt(token: string): { recipientId: number } | null {
  try {
    // Remove "Bearer " prefix if present
    const realToken = token.startsWith("Bearer ") ? token.slice(7) : token
    return jwt.verify(realToken, SECRET) as { recipientId: number }
  } catch(e) {
    console.error('Error verifying JWT', e)
    return null
  }
}

export function withAuth(
  handler: (event: any, payload: { recipientId: number }) => any
): APIGatewayProxyHandlerV2 {
  return async (event) => {
    const authHeader = event.headers?.authorization || event.headers?.Authorization
    const payload = authHeader ? verifyJwt(authHeader) : null

    if (!payload) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Unauthorized" }),
      }
    }

    return handler(event, payload)
  }
}