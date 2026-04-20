import { useMemo } from 'react'
import { computeNetBalances, simplifyDebts } from '../utils/debtSimplifier'

// ADDED settlements as a parameter
export function useBalances(expenses, settlements, members) {
  
  const netBalances = useMemo(
    () => computeNetBalances(expenses, settlements, members),
    [expenses, settlements, members] // Added dependency
  )

  const transactions = useMemo(
    () => simplifyDebts(netBalances),
    [netBalances]
  )

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses]
  )

  return { netBalances, transactions, totalExpenses }
}