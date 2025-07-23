const https = require('https')

// Replace with your actual API endpoint after deployment
const API_ENDPOINT =
  'https://your-api-endpoint.execute-api.us-east-1.amazonaws.com'

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(API_ENDPOINT).hostname,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (data) {
      const postData = JSON.stringify(data)
      options.headers['Content-Length'] = Buffer.byteLength(postData)
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const response = JSON.parse(body)
          resolve({
            statusCode: res.statusCode,
            body: response,
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            body: body,
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

async function testAPI() {
  console.log('🧪 Testing HomeThrive SST API...\n')

  try {
    // Test health check
    console.log('1. Testing health check...')
    const health = await makeRequest('GET', '/')
    console.log(`   Status: ${health.statusCode}`)
    console.log(`   Response: ${JSON.stringify(health.body, null, 2)}\n`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  if (
    API_ENDPOINT ===
    'https://your-api-endpoint.execute-api.us-east-1.amazonaws.com'
  ) {
    console.log(
      '⚠️  Please update the API_ENDPOINT variable with your actual API endpoint',
    )
    console.log('   You can find this in the SST console or deployment output')
    process.exit(1)
  }

  testAPI()
}

module.exports = { makeRequest, testAPI }
