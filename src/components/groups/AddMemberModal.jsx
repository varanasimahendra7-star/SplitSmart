// src/components/groups/AddMemberModal.jsx
import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { updateGroup, logActivity } from '../../services/expenseService'
import { useAuth } from '../../context/AuthContext'
import { UserPlus, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function AddMemberModal({ isOpen, onClose, group, setGroup, editingMember, expenses = [] }) {
  const { user } = useAuth()
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  // Safety check: is this person tied to any group math?
  const isUsedInExpenses = editingMember ? expenses.some(exp => 
    exp.paidBy === editingMember.uid || 
    exp.splitAmong?.some(s => s.uid === editingMember.uid)
  ) : false

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name || '')
      setEmail(editingMember.email || '')
    } else {
      setName('')
      setEmail('')
    }
  }, [editingMember, isOpen])

  const handleSave = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    
    if (!trimmedName) return toast.error('Name is required')

    const isEditing = !!editingMember
    
    // Duplicate check
    const alreadyMember = group.members?.some((m) => {
      if (isEditing && m.uid === editingMember.uid) return false
      if (m.name?.toLowerCase() === trimmedName.toLowerCase()) return true
      if (trimmedEmail !== '' && m.email?.toLowerCase() === trimmedEmail) return true
      return false
    })

    if (alreadyMember) return toast.error('This person is already in the group')

    setSaving(true)

    let updatedMembers
    if (isEditing) {
      updatedMembers = group.members.map((m) =>
        m.uid === editingMember.uid
          ? { ...m, name: trimmedName, email: trimmedEmail || null }
          : m
      )
    } else {
      const newMember = {
        uid:   `manual_${Date.now()}`,
        name:  trimmedName,
        email: trimmedEmail || null, 
        photo: null,
      }
      updatedMembers = [...(group.members || []), newMember]
    }

    try {
      await updateGroup(group.id, { members: updatedMembers })
      const userName = user?.displayName?.split(' ')[0] || 'A member'
      
      if (isEditing) {
        // ✨ SMART LOGGING: Compare old vs new
        let changes = []
        if (editingMember.name !== trimmedName) {
          changes.push(`name from "${editingMember.name}" to "${trimmedName}"`)
        }
        if ((editingMember.email || '') !== trimmedEmail) {
          const oldEmail = editingMember.email || 'no email'
          const newEmail = trimmedEmail || 'removed email'
          changes.push(`email from "${oldEmail}" to "${newEmail}"`)
        }

        if (changes.length > 0) {
          await logActivity(group.id, `👤 ${userName} changed ${changes.join(' and ')}.`)
        }
        toast.success('Member updated!')
      } else {
        await logActivity(group.id, `👋 ${userName} added ${trimmedName} to the group.`)
        toast.success(`${trimmedName} added!`)
      }

      setGroup((prev) => ({ ...prev, members: updatedMembers }))
      onClose()
    } catch (err) {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isUsedInExpenses) return toast.error('Cannot remove: Member has active expenses.')
    if (!window.confirm(`Are you sure you want to remove ${editingMember.name}?`)) return

    setSaving(true)
    const updatedMembers = group.members.filter(m => m.uid !== editingMember.uid)

    try {
      await updateGroup(group.id, { members: updatedMembers })
      const userName = user?.displayName?.split(' ')[0] || 'A member'
      await logActivity(group.id, `🚨 ${userName} removed ${editingMember.name} from the group.`)
      
      setGroup((prev) => ({ ...prev, members: updatedMembers }))
      toast.success('Member removed')
      onClose()
    } catch {
      toast.error('Failed to remove')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingMember ? "Edit Member" : "Add Member"} size="sm">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="label">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="input"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="input"
          />
        </div>
        <div className="flex gap-2 pt-2">
          {editingMember && editingMember.uid !== user?.uid && (
            <button 
              type="button" 
              onClick={handleDelete} 
              disabled={saving || isUsedInExpenses} 
              className={`flex-shrink-0 px-3 flex items-center justify-center rounded-lg transition-all
                ${isUsedInExpenses 
                  ? 'bg-surface-DEFAULT border border-surface-border text-slate-600 cursor-not-allowed opacity-50' 
                  : 'btn-danger'}`}
            >
              <Trash2 size={16} />
            </button>
          )}

          <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? 'Saving…' : editingMember ? 'Update' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  )
}