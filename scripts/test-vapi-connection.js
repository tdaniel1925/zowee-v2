/**
 * Test VAPI Connection
 * Verifies VAPI API key is valid and connection works
 */

require('dotenv').config({ path: '.env.local' })

async function testVapiConnection() {
  console.log('🧪 Testing VAPI connection...\n')

  const apiKey = process.env.VAPI_API_KEY
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET

  if (!apiKey) {
    console.log('❌ VAPI_API_KEY not found in .env.local')
    console.log('   Please add your VAPI API key from https://vapi.ai\n')
    return false
  }

  if (!webhookSecret) {
    console.log('⚠️  VAPI_WEBHOOK_SECRET not found in .env.local')
    console.log('   This is optional but recommended for security\n')
  }

  console.log('✅ VAPI_API_KEY found')
  console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`)

  if (webhookSecret) {
    console.log('✅ VAPI_WEBHOOK_SECRET found')
    console.log(`   Secret: ${webhookSecret.substring(0, 10)}...\n`)
  }

  try {
    console.log('📡 Testing API connection...')

    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 401) {
      console.log('❌ Authentication failed')
      console.log('   Your API key is invalid or expired')
      console.log('   Please check your VAPI dashboard: https://vapi.ai\n')
      return false
    }

    if (!response.ok) {
      console.log(`⚠️  API returned status ${response.status}`)
      const error = await response.text()
      console.log(`   Error: ${error}\n`)
      return false
    }

    const assistants = await response.json()
    console.log('✅ API connection successful!')
    console.log(`   Found ${assistants.length || 0} existing assistants\n`)

    if (assistants.length > 0) {
      console.log('📋 Existing assistants:')
      assistants.slice(0, 3).forEach((assistant) => {
        console.log(`   - ${assistant.name} (${assistant.id})`)
      })
      if (assistants.length > 3) {
        console.log(`   ... and ${assistants.length - 3} more`)
      }
      console.log()
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ VAPI CONNECTION TEST PASSED!\n')
    console.log('Next steps:')
    console.log('1. Configure webhook in VAPI dashboard:')
    console.log('   URL: https://pokkit.ai/api/vapi/webhook')
    console.log(`   Secret: ${webhookSecret || '(generate one)'}`)
    console.log('2. Deploy to production')
    console.log('3. Test voice calling\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
}

// Run the test
testVapiConnection()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Test error:', error)
    process.exit(1)
  })
