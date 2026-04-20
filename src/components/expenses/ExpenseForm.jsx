// src/components/expenses/ExpenseForm.jsx
import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { CATEGORIES } from '../ui/CategoryBadge'
import { addExpense, updateExpense, logActivity } from '../../services/expenseService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const EMPTY = {
  title: '', amount: '', paidBy: '', category: 'Food', splitType: 'equal', notes: '',
}

export function ExpenseForm({ isOpen, onClose, groupId, members, editingExpense }) {
  const { user }                  = useAuth()
  const [form,     setForm]       = useState(EMPTY)
  const [selected, setSelected]   = useState([])
  const [saving,   setSaving]     = useState(false)

  const isEditing = !!editingExpense

  useEffect(() => {
    if (editingExpense) {
      setForm({
        title:    editingExpense.title,
        amount:   editingExpense.amount,
        paidBy:   editingExpense.paidBy,
        category: editingExpense.category,
        notes:    editingExpense.notes || '',
        splitType: 'equal',
      })
      setSelected(editingExpense.splitAmong?.map((s) => s.uid) || [])
    } else {
      setForm({ ...EMPTY, paidBy: user?.uid || '' })
      setSelected(members.map((m) => m.uid))
    }
  }, [editingExpense, isOpen, user, members])

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const toggleMember = (uid) =>
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    )

  const handleSubmit = async (e) => {
    e.preventDefault()

    // ✅ Validation
    if (!form.title.trim())               return toast.error('Title is required')
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount')
    if (!form.paidBy)                     return toast.error('Select who paid')
    if (selected.length === 0)            return toast.error('Select at least one person')

    setSaving(true)

    const perPerson  = Number(form.amount) / selected.length
    const splitAmong = selected.map((uid) => ({
      uid,
      share: Math.round(perPerson * 100) / 100,
    }))

    const payload = {
      title:     form.title.trim(),
      amount:    Number(form.amount),
      paidBy:    form.paidBy,
      category:  form.category,
      notes:     form.notes.trim(),   // ✨ Notes field
      splitAmong,
    }

    try {
      const userName = user?.displayName?.split(' ')[0] || 'A member'

      if (isEditing) {
        let changes = []

        if (Number(editingExpense.amount) !== payload.amount)
          changes.push(`amount from ₹${editingExpense.amount} to ₹${payload.amount}`)

        const oldUids = editingExpense.splitAmong?.map(s => s.uid) || []
        const added   = selected.filter(uid => !oldUids.includes(uid))
          .map(uid => members.find(m => m.uid === uid)?.name || 'member')
        const removed = oldUids.filter(uid => !selected.includes(uid))
          .map(uid => members.find(m => m.uid === uid)?.name || 'member')

        if (added.length)   changes.push(`added ${added.join(', ')} to split`)
        if (removed.length) changes.push(`removed ${removed.join(', ')} from split`)

        const logText = changes.length > 0
          ? `updated "${payload.title}" (${changes.join('; ')})`
          : `updated the "${payload.title}" expense`

        await updateExpense(groupId, editingExpense.id, payload)
        await logActivity(groupId, `✏️ ${userName} ${logText}.`)
        toast.success('Expense updated')
      } else {
        await addExpense(groupId, payload)
        await logActivity(groupId, `🧾 ${userName} added a ₹${form.amount} expense for "${form.title}".`)
        toast.success('Expense added')
      }
      onClose()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Expense' : 'Add Expense'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Title */}
        <div>
          <label className="label">Description</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Dinner at Barbeque Nation"
            className="input"
          />
        </div>

        {/* Amount + Category */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">Amount (₹)</label>
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="input"
            />
          </div>
          <div className="flex-1">
            <label className="label">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="input">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Paid By */}
        <div>
          <label className="label">Paid By</label>
          <select name="paidBy" value={form.paidBy} onChange={handleChange} className="input">
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Split Among */}
        <div>
          <label className="label">Split Among</label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.uid}
                type="button"
                onClick={() => toggleMember(m.uid)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selected.includes(m.uid)
                    ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                    : 'border-surface-border text-slate-500 hover:border-slate-400'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          {/* ✨ Per-person calculation */}
          {selected.length > 0 && form.amount && (
            <p className="text-xs text-slate-500 mt-2 font-mono">
              ₹{(Number(form.amount) / selected.length).toFixed(2)} per person · {selected.length} people
            </p>
          )}
        </div>

        {/* ✨ Notes field */}
        <div>
          <label className="label">Notes <span className="normal-case text-slate-600 font-body font-normal">(optional)</span></label>
          <input
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="e.g. Ramu didn't join so excluded him"
            className="input"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? 'Saving…' : isEditing ? 'Update' : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}