import { useState, useCallback } from 'react'

const STORAGE_KEY = 'dota2_recent_searches'
const MAX_ITEMS = 5

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(loadHistory)

  const add = useCallback((accountId: string) => {
    setHistory(prev => {
      const next = [accountId, ...prev.filter(id => id !== accountId)].slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const remove = useCallback((accountId: string) => {
    setHistory(prev => {
      const next = prev.filter(id => id !== accountId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { history, add, remove }
}
