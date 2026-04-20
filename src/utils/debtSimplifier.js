// src/utils/debtSimplifier.js
// ⭐ The core algorithm — minimizes number of transactions to settle all debts.
// Explain this clearly in your viva — it's a greedy approach on net balances.

/**
 * Given a list of expenses, compute each member's net balance.
 * Positive = owed money by the group. Negative = owes money to others.
 *
 * @param {Array} expenses   — array of expense objects from Firestore
 * @param {Array} members    — array of { uid, name } objects
 * @returns {Object}         — { uid: netAmount }
 */
/**
 * Given a list of expenses and settlements, compute each member's net balance.
 */
export function computeNetBalances(expenses, settlements = [], members) {
  const balances = {}
  members.forEach((m) => (balances[m.uid] = 0))

  // 1. Calculate balances from Expenses
  expenses.forEach((expense) => {
    const { paidBy, amount, splitAmong } = expense
    if (!paidBy || !amount || !splitAmong) return

    balances[paidBy] = (balances[paidBy] || 0) + Number(amount)
    splitAmong.forEach(({ uid, share }) => {
      balances[uid] = (balances[uid] || 0) - Number(share)
    })
  })

  // 2. Adjust balances from Settlements (This fixes the bug!)
  settlements.forEach((settlement) => {
    const { from, to, amount } = settlement
    if (!from || !to || !amount) return

    // The person who paid off their debt ('from') gets their balance credited
    balances[from] = (balances[from] || 0) + Number(amount)
    // The person who received the money ('to') gets their balance debited
    balances[to] = (balances[to] || 0) - Number(amount)
  })

  return balances
}


/**
 * Simplify debts into minimum number of transactions.
 * Uses greedy matching of largest creditor ↔ largest debtor.
 *
 * @param {Object} balances  — { uid: netAmount }
 * @returns {Array}          — [{ from, to, amount }]
 */
export function simplifyDebts(balances) {
  const creditors = [] // people owed money (positive balance)
  const debtors   = [] // people who owe money (negative balance)

  Object.entries(balances).forEach(([uid, amount]) => {
    const rounded = Math.round(amount * 100) / 100
    if (rounded > 0.01)  creditors.push({ uid, amount: rounded })
    if (rounded < -0.01) debtors.push({ uid, amount: -rounded })
  })

  // Sort descending so we match largest first
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transactions = []

  while (creditors.length && debtors.length) {
    const creditor = creditors[0]
    const debtor   = debtors[0]
    const settled  = Math.min(creditor.amount, debtor.amount)

    transactions.push({
      from:   debtor.uid,
      to:     creditor.uid,
      amount: Math.round(settled * 100) / 100,
    })

    creditor.amount -= settled
    debtor.amount   -= settled

    if (creditor.amount < 0.01) creditors.shift()
    if (debtor.amount   < 0.01) debtors.shift()
  }

  return transactions
}

/**
 * Category breakdown for analytics dashboard.
 * @param {Array} expenses
 * @returns {Array} [{ category, total }] sorted by total desc
 */
export function getCategoryBreakdown(expenses) {
  const totals = {}
  expenses.forEach(({ category, amount }) => {
    const cat = category || 'Other'
    totals[cat] = (totals[cat] || 0) + Number(amount)
  })
  return Object.entries(totals)
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Spending per member.
 * @param {Array} expenses
 * @param {Array} members
 * @returns {Array} [{ name, total }]
 */
export function getSpendingByMember(expenses, members) {
  const totals = {}
  members.forEach((m) => (totals[m.uid] = 0))
  expenses.forEach(({ paidBy, amount }) => {
    totals[paidBy] = (totals[paidBy] || 0) + Number(amount)
  })
  return members.map((m) => ({
    name:  m.name,
    total: Math.round((totals[m.uid] || 0) * 100) / 100,
  })).sort((a, b) => b.total - a.total)
}

/**
 * Daily spend trend (last 14 days).
 * @param {Array} expenses
 * @returns {Array} [{ date, total }]
 */
export function getDailyTrend(expenses) {
  const totals = {}
  expenses.forEach(({ amount, createdAt }) => {
    if (!createdAt) return
    const date = new Date(createdAt.seconds * 1000).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
    })
    totals[date] = (totals[date] || 0) + Number(amount)
  })
  return Object.entries(totals)
    .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))
    .slice(-14)
}