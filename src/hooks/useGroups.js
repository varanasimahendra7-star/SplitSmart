import { useState, useEffect } from 'react'
import { subscribeToGroups } from '../services/expenseService'

export function useGroups(user) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !user.uid) return

    setLoading(true)
    const unsubscribe = subscribeToGroups(user, (data) => {
      setGroups(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { groups, loading }
}