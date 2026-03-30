/**
 * Quick script to check browser task statuses
 * Shows what's happening with research tasks
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTasks() {
  console.log('📊 Checking Browser Task Status\n')

  // Get task counts by status
  const { data: tasks, error } = await supabase
    .from('jordyn_browser_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!tasks || tasks.length === 0) {
    console.log('✓ No tasks found in database')
    return
  }

  console.log(`Found ${tasks.length} recent tasks:\n`)

  // Group by status
  const statusCounts = {}
  tasks.forEach((task) => {
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1
  })

  console.log('Status Breakdown:')
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })

  console.log('\nRecent Tasks:')
  tasks.forEach((task) => {
    const age = Math.round((Date.now() - new Date(task.created_at).getTime()) / 1000 / 60)
    console.log(
      `  [${task.status}] ${task.task_type} - ${task.intent?.intent || 'unknown'} (${age}m ago)${
        task.notified_at ? ' ✓ notified' : ''
      }`
    )
  })

  // Show stuck pending tasks
  const pendingTasks = tasks.filter((t) => t.status === 'pending')
  if (pendingTasks.length > 0) {
    console.log('\n⚠️  STUCK PENDING TASKS:')
    pendingTasks.forEach((task) => {
      const age = Math.round((Date.now() - new Date(task.created_at).getTime()) / 1000 / 60)
      console.log(
        `  ID: ${task.id}\n  Type: ${task.task_type}\n  Age: ${age} minutes\n  Instructions: ${task.instructions.substring(0, 100)}...\n`
      )
    })
  }

  // Show completed but not notified
  const unnotified = tasks.filter((t) => t.status === 'completed' && !t.notified_at)
  if (unnotified.length > 0) {
    console.log('\n⚠️  COMPLETED BUT NOT NOTIFIED:')
    unnotified.forEach((task) => {
      console.log(`  ID: ${task.id}`)
      console.log(`  Type: ${task.task_type}`)
      console.log(`  Completed: ${new Date(task.completed_at).toLocaleString()}`)
      console.log(`  Reply to: ${task.reply_to_number || 'not set'}`)
      console.log(`  Result: ${task.result ? 'Yes' : 'No'}\n`)
    })
  }
}

checkTasks().then(() => process.exit(0))
