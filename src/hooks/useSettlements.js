// src/hooks/useSettlements.js
import { useState, useEffect } from 'react'
import { subscribeToSettlements } from '../services/expenseService'

export function useSettlements(groupId) {
  const [settlements, setSettlements] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!groupId) { setLoading(false); return }

    const unsubscribe = subscribeToSettlements(groupId, (data) => {
      setSettlements(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [groupId])

  return { settlements, loading }
}