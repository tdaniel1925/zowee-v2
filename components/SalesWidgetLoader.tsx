'use client'

/**
 * Sales Widget Loader
 * Fetches the assistant ID and loads the widget
 */

import { useEffect, useState } from 'react'
import SalesWidget from './SalesWidget'

export default function SalesWidgetLoader() {
  const [assistantId, setAssistantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch the sales agent assistant ID
    fetch('/api/sales-agent')
      .then((res) => res.json())
      .then((data) => {
        if (data.assistantId) {
          setAssistantId(data.assistantId)
        }
      })
      .catch((error) => {
        console.error('[Sales Widget] Failed to load:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Don't render until we have the assistant ID
  if (loading || !assistantId) {
    return null
  }

  return <SalesWidget assistantId={assistantId} />
}
