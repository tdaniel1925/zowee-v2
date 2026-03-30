/**
 * Test script to manually trigger cron jobs
 * Run: npx tsx scripts/test-cron-jobs.ts
 */

async function testCronJobs() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const cronSecret = process.env.CRON_SECRET || 'no-secret-in-dev'

  console.log('🧪 Testing Cron Jobs\n')
  console.log(`Base URL: ${baseUrl}`)
  console.log(`Using CRON_SECRET: ${cronSecret ? '✓ Set' : '✗ Not set'}\n`)

  // Test execute-tasks
  console.log('1️⃣  Testing /api/cron/execute-tasks...')
  try {
    const executeResponse = await fetch(`${baseUrl}/api/cron/execute-tasks`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    })
    const executeData = await executeResponse.json()
    console.log('   Response:', executeResponse.status, executeResponse.statusText)
    console.log('   Data:', JSON.stringify(executeData, null, 2))
  } catch (error: any) {
    console.error('   Error:', error.message)
  }

  console.log('\n2️⃣  Testing /api/cron/poll-tasks...')
  try {
    const pollResponse = await fetch(`${baseUrl}/api/cron/poll-tasks`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    })
    const pollData = await pollResponse.json()
    console.log('   Response:', pollResponse.status, pollResponse.statusText)
    console.log('   Data:', JSON.stringify(pollData, null, 2))
  } catch (error: any) {
    console.error('   Error:', error.message)
  }

  console.log('\n✅ Test complete!')
}

testCronJobs()
