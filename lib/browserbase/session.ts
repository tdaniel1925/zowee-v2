/**
 * Browserbase Session Management
 * Creates and manages browser automation sessions
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { BrowserTask, CreateBrowserTaskInput } from './types'

/**
 * Create a new browser task in the database
 * This task will be picked up by Twin for execution
 */
export async function createBrowserTask(
  input: CreateBrowserTaskInput,
  supabase: SupabaseClient<any>
): Promise<BrowserTask> {
  const { data, error } = await supabase
    .from('jordyn_browser_tasks')
    .insert({
      user_id: input.user_id,
      task_type: input.task_type,
      status: input.status || 'pending',
      intent: input.intent,
      instructions: input.instructions,
      reply_to_number: input.reply_to_number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating browser task:', error)
    throw new Error('Failed to create browser task')
  }

  return data as BrowserTask
}

/**
 * Get task by ID
 */
export async function getBrowserTask(
  taskId: string,
  supabase: SupabaseClient<any>
): Promise<BrowserTask | null> {
  const { data, error } = await supabase
    .from('jordyn_browser_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (error) {
    console.error('Error fetching browser task:', error)
    return null
  }

  return data as BrowserTask
}

/**
 * Update browser task status
 */
export async function updateBrowserTaskStatus(
  taskId: string,
  status: BrowserTask['status'],
  supabase: SupabaseClient<any>,
  additionalData?: Partial<BrowserTask>
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
    ...additionalData,
  }

  if (status === 'running' && !additionalData?.started_at) {
    updateData.started_at = new Date().toISOString()
  }

  if (status === 'completed' || status === 'failed') {
    if (!additionalData?.completed_at) {
      updateData.completed_at = new Date().toISOString()
    }
    // Calculate processing time if started_at exists
    const { data: task } = await supabase
      .from('jordyn_browser_tasks')
      .select('started_at')
      .eq('id', taskId)
      .single()

    if (task?.started_at && !additionalData?.processing_ms) {
      const startTime = new Date(task.started_at).getTime()
      const endTime = new Date(updateData.completed_at).getTime()
      updateData.processing_ms = endTime - startTime
    }
  }

  const { error } = await supabase
    .from('jordyn_browser_tasks')
    .update(updateData)
    .eq('id', taskId)

  if (error) {
    console.error('Error updating browser task:', error)
    throw new Error('Failed to update browser task')
  }
}

/**
 * Mark task as completed with results
 */
export async function completeBrowserTask(
  taskId: string,
  result: any,
  screenshotUrl: string | undefined,
  supabase: SupabaseClient<any>
): Promise<void> {
  await updateBrowserTaskStatus(taskId, 'completed', supabase, {
    result,
    screenshot_url: screenshotUrl,
  })
}

/**
 * Mark task as failed with error
 */
export async function failBrowserTask(
  taskId: string,
  error: string,
  supabase: SupabaseClient<any>
): Promise<void> {
  await updateBrowserTaskStatus(taskId, 'failed', supabase, {
    error,
  })
}

/**
 * Get pending tasks (for Twin to poll)
 */
export async function getPendingBrowserTasks(
  supabase: SupabaseClient<any>,
  limit: number = 10
): Promise<BrowserTask[]> {
  const { data, error } = await supabase
    .from('jordyn_browser_tasks')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching pending tasks:', error)
    return []
  }

  return data as BrowserTask[]
}

/**
 * Get completed tasks that haven't been notified yet
 */
export async function getUnnotifiedCompletedTasks(
  supabase: SupabaseClient<any>,
  limit: number = 20
): Promise<BrowserTask[]> {
  // Get tasks completed in last 10 minutes that haven't been notified
  const tenMinutesAgo = new Date()
  tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)

  const { data, error} = await supabase
    .from('jordyn_browser_tasks')
    .select('*')
    .eq('status', 'completed')
    .is('notified_at', null)
    .gte('completed_at', tenMinutesAgo.toISOString())
    .order('completed_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching unnotified tasks:', error)
    return []
  }

  return data as BrowserTask[]
}

/**
 * Mark task as notified
 */
export async function markTaskNotified(
  taskId: string,
  supabase: SupabaseClient<any>
): Promise<void> {
  const { error } = await supabase
    .from('jordyn_browser_tasks')
    .update({
      notified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  if (error) {
    console.error('Error marking task as notified:', error)
    throw new Error('Failed to mark task as notified')
  }
}

/**
 * Load user profile for form filling
 */
export async function loadUserProfile(
  userId: string,
  supabase: SupabaseClient<any>
): Promise<any> {
  const { data: user, error } = await supabase
    .from('jordyn_users')
    .select('name, email, phone, profile')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error loading user profile:', error)
    return {}
  }

  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    ...(user.profile || {}),
  }
}
