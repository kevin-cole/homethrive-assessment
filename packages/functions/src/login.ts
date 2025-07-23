import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'your-256-bit-secret'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // In a real app, you'd validate credentials here
  const token = jwt.sign({ recipientId: 1 }, SECRET, { expiresIn: '1h' })
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }
}
