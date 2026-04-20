// src/hooks/useExpenses.js
// Custom hook — encapsulates real-time expense subscription.
// Demonstrates: custom hooks, useEffect cleanup, real-time Firestore.

import { useState, useEffect } from 'react'
import { subscribeToExpenses } from '../services/expenseService'

export function useExpenses(groupId) {
  const [expenses, setExpenses] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    if (!groupId) { setLoading(false); return }

    setLoading(true)
    setError(null)

    // onSnapshot returns an unsubscribe function — perfect for useEffect cleanup
    const unsubscribe = subscribeToExpenses(groupId, (data) => {
      setExpenses(data)
      setLoading(false)
    })

    return () => unsubscribe() // cleanup on unmount or groupId change
  }, [groupId])

  return { expenses, loading, error }
}