// src/components/expenses/ExpenseCard.jsx
import { useCallback, useState, useMemo } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { deleteExpense, logActivity } from '../../services/expenseService'
import { useAuth } from '../../context/AuthContext'
import { CategoryBadge } from '../ui/CategoryBadge'
import toast from 'react-hot-toast'

export function ExpenseCard({ expense, groupId, members, onEdit }) {
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()

  // useMemo — recomputes only when members list or paidBy changes
  const paidByMember = useMemo(
    () => members?.find((m) => m.uid === expense.paidBy),
    [members, expense.paidBy]
  )

  // useCallback — stable reference, avoids unnecessary child re-renders
  const handleDelete = useCallback(async () => {
    if (!window.confirm('Delete this expense?')) return
    setDeleting(true)
    try {
      await deleteExpense(groupId, expense.id)
      const userName = user?.displayName?.split(' ')[0] || 'A member'
      await logActivity(groupId, `🗑️ ${userName} deleted the "${expense.title}" expense.`)
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete')
      setDeleting(false)
    }
  }, [groupId, expense.id, expense.title, user])

  const date = expense.createdAt
    ? new Date(expense.createdAt.seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short',
      })
    : '—'

  return (
    <div className="card p-4 flex items-center gap-4 animate-fade-in hover:border-surface-hover transition-colors">
      {/* Category icon */}
      <div className="w-10 h-10 rounded-xl bg-surface-DEFAULT flex items-center justify-center flex-shrink-0">
        <CategoryIcon category={expense.category} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-slate-100 truncate">{expense.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-500 font-body">
            Paid by <span className="text-slate-300">{paidByMember?.name || 'Unknown'}</span>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-500">{date}</span>
          <CategoryBadge category={expense.category} />
        </div>
        {/* ✨ Notes — shown only if present */}
        {expense.notes && (
          <p className="text-xs text-slate-500 mt-1 italic truncate">"{expense.notes}"</p>
        )}
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="font-mono font-bold text-white text-lg">
          ₹{Number(expense.amount).toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-slate-500">÷ {expense.splitAmong?.length || 0} people</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(expense)} className="btn-ghost p-2 rounded-lg">
          <Pencil size={15} />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="btn-danger p-2 rounded-lg">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

function CategoryIcon({ category }) {
  const icons = {
    Food: '🍔', Travel: '✈️', Rent: '🏠', Utilities: '💡',
    Fun: '🎉', Shopping: '🛍️', Other: '📦',
  }
  return <span className="text-lg">{icons[category] || icons.Other}</span>
}