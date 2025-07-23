export const NotFound = (message: string) => ({
  statusCode: 404,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ error: message || 'Not Found' }),
})

export const MethodNotAllowed = () => ({
  statusCode: 405,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ error: 'Method not allowed' }),
})

export const BadRequest = (error: string) => ({
  statusCode: 400,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ error }),
})

export const Unauthorized = () => ({
  statusCode: 401,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ error: 'Unauthorized' }),
})

export const Created = (data: any) => ({
  statusCode: 201,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})

export const Ok = (data: any) => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})

export const InternalServerError = (error: string, message?: string) => ({
  statusCode: 500,
  headers: {
    'Content-Type': 'application/json',
  },
  body: {
    error: error,
    message: message || 'Internal server error',
  },
})