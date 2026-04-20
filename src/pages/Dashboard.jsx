// src/pages/Dashboard.jsx
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGroups } from '../hooks/useGroups'
import { createGroup, subscribeToExpenses, subscribeToSettlements } from '../services/expenseService'
import { computeNetBalances, simplifyDebts } from '../utils/debtSimplifier'
import { Modal } from '../components/ui/Modal'
import { Loader } from '../components/ui/Loader'
import { EmptyState } from '../components/ui/EmptyState'
import { Plus, Users, Plane, Home, PartyPopper, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
 
const GROUP_TYPES = [
  { value: 'trip',     label: 'Trip',      icon: Plane,        color: 'text-blue-400'   },
  { value: 'home',     label: 'Flatmates', icon: Home,         color: 'text-purple-400' },
  { value: 'event',   label: 'Event',      icon: PartyPopper,  color: 'text-pink-400'   },
  { value: 'general', label: 'General',    icon: Users,        color: 'text-slate-400'  },
]
 
// ✨ Hook: fetches live balance for a single group
function useGroupBalance(groupId, members, userId) {
  const [balance, setBalance] = useState(null)
 
  useEffect(() => {
    if (!groupId || !members?.length) return
 
    let expenses    = []
    let settlements = []
 
    const compute = () => {
      const balances = computeNetBalances(expenses, settlements, members)
      setBalance(balances[userId] || 0)
    }
 
    const unsubExp = subscribeToExpenses(groupId, (data) => {
      expenses = data
      compute()
    })
    const unsubSet = subscribeToSettlements(groupId, (data) => {
      settlements = data
      compute()
    })
 
    return () => { unsubExp(); unsubSet() }
  }, [groupId, members, userId])
 
  return balance
}
 
export default function Dashboard() {
  const { user }            = useAuth()
  const { groups, loading } = useGroups(user)
  const navigate            = useNavigate()
 
  const [showCreate, setShowCreate] = useState(false)
  const [name,       setName]       = useState('')
  const [type,       setType]       = useState('trip')
  const [saving,     setSaving]     = useState(false)
 
  const handleCreate = useCallback(async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Group name is required')
 
    setSaving(true)
    try {
      const docRef = await createGroup({
        name: name.trim(),
        type,
        members: [{
          uid:   user.uid,
          name:  user.displayName,
          email: user.email,
          photo: user.photoURL,
        }],
        createdBy: user.uid,
      })
      toast.success('Group created!')
      setShowCreate(false)
      setName('')
      navigate(`/groups/${docRef.id}`)
    } catch {
      toast.error('Failed to create group')
    } finally {
      setSaving(false)
    }
  }, [name, type, user, navigate])
 
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }
 
  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-slate-500 font-body text-sm">{greeting()},</p>
          <h1 className="font-display font-extrabold text-3xl text-white mt-0.5">
            {user?.displayName?.split(' ')[0]} 👋
          </h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} /> New Group
        </button>
      </div>
 
      {/* Groups */}
      {loading ? (
        <Loader />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create your first group to start splitting expenses with friends."
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={18} /> Create Group
            </button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {groups.map((group, i) => (
            <GroupCard
              key={group.id}
              group={group}
              userId={user.uid}
              onClick={() => navigate(`/groups/${group.id}`)}
              delay={i}
            />
          ))}
        </div>
      )}
 
      {/* Create Group Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create a Group">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="label">Group Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Trip 2025"
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {GROUP_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all
                    ${type === value
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-surface-border hover:border-slate-500'}`}
                >
                  <Icon size={20} className={type === value ? 'text-brand-400' : color} />
                  <span className="text-xs font-body text-slate-300">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
 
// ✨ GroupCard now shows live personal balance per group
function GroupCard({ group, userId, onClick, delay }) {
  const typeIcons = { trip: '✈️', home: '🏠', event: '🎉', general: '👥' }
 
  // Live balance for this group
  const balance = useGroupBalance(group.id, group.members, userId)
 
  return (
    <button
      onClick={onClick}
      className="card p-5 text-left hover:border-slate-600 transition-all duration-200 animate-fade-up hover:-translate-y-0.5 group"
      style={{ animationDelay: `${delay * 60}ms` }}
    >
      <div className="flex items-center gap-4">
        {/* Type icon */}
        <div className="w-12 h-12 rounded-xl bg-surface-DEFAULT flex items-center justify-center text-2xl flex-shrink-0">
          {typeIcons[group.type] || '👥'}
        </div>
 
        {/* Name + members */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-white group-hover:text-brand-400 transition-colors truncate">
            {group.name}
          </p>
          <p className="text-sm text-slate-500 font-body mt-0.5">
            {group.members?.length} member{group.members?.length !== 1 ? 's' : ''}
          </p>
        </div>
 
        {/* ✨ Live balance pill */}
        {balance !== null && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold flex-shrink-0
            ${balance > 0.01  ? 'bg-brand-500/15 text-brand-400' :
              balance < -0.01 ? 'bg-red-500/15 text-red-400' :
                                'bg-surface-border text-slate-500'}`}>
            {balance > 0.01  ? <><TrendingUp size={11} /> +₹{balance.toFixed(0)}</> :
             balance < -0.01 ? <><TrendingDown size={11} /> -₹{Math.abs(balance).toFixed(0)}</> :
                               'Settled'}
          </div>
        )}
 
        {/* Member avatars */}
        <div className="flex -space-x-2 flex-shrink-0">
          {group.members?.slice(0, 4).map((m) => (
            <img
              key={m.uid}
              src={m.photo || `https://ui-avatars.com/api/?name=${m.name}&background=1e2535&color=94a3b8`}
              alt={m.name}
              className="w-8 h-8 rounded-full ring-2 ring-surface-card object-cover"
            />
          ))}
        </div>
      </div>
    </button>
  )
}
 