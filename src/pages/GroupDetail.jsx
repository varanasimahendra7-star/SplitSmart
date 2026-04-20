// src/pages/GroupDetail.jsx
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useExpenses } from '../hooks/useExpenses'
import { useBalances } from '../hooks/useBalances'
import { useSettlements } from '../hooks/useSettlements'
import { ExpenseCard } from '../components/expenses/ExpenseCard'
import { ExpenseForm } from '../components/expenses/ExpenseForm'
import { BalanceSummary } from '../components/settlements/BalanceSummary'
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard'
import { Loader } from '../components/ui/Loader'
import { EmptyState } from '../components/ui/EmptyState'
import { AddMemberModal } from '../components/groups/AddMemberModal'
import { deleteSettlement, subscribeToActivity, logActivity, updateGroup } from '../services/expenseService'
import toast from 'react-hot-toast'
import {
  Plus, Receipt, BarChart3, ArrowLeftRight,
  ArrowLeft, UserPlus, Trash2, Activity, Download, LogOut,
  MoreVertical, Search, Target, AlertTriangle,
} from 'lucide-react'
 
const TABS = [
  { id: 'expenses',  label: 'Expenses',    icon: Receipt        },
  { id: 'balances',  label: 'Balances',    icon: ArrowLeftRight },
  { id: 'analytics', label: 'Analytics',   icon: BarChart3      },
  { id: 'history',   label: 'Audit Trail', icon: Activity       },
]
 
export default function GroupDetail() {
  const { groupId }  = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const menuRef      = useRef(null)
 
  const [editingMember,  setEditingMember]  = useState(null)
  const [group,          setGroup]          = useState(null)
  const [groupLoading,   setGroupLoading]   = useState(true)
  const [activeTab,      setActiveTab]      = useState('expenses')
  const [showForm,       setShowForm]       = useState(false)
  const [editingExp,     setEditingExp]     = useState(null)
  const [showAddMember,  setShowAddMember]  = useState(false)
  const [filter,         setFilter]         = useState('')
  const [activities,     setActivities]     = useState([])
  const [showMenu,       setShowMenu]       = useState(false)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [showSearch,     setShowSearch]     = useState(false)
  const [budget,         setBudget]         = useState('')
  const [showBudget,     setShowBudget]     = useState(false)
  const [budgetInput,    setBudgetInput]    = useState('')
 
  const { expenses,    loading: expLoading } = useExpenses(groupId)
  const { settlements, loading: setLoading } = useSettlements(groupId)
  const { netBalances, transactions, totalExpenses } = useBalances(
    expenses,
    settlements,
    group?.members || []
  )
 
  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
 
  // Fetch group + subscribe to activity
  useEffect(() => {
    const fetchGroup = async () => {
      const snap = await getDoc(doc(db, 'groups', groupId))
      if (snap.exists()) {
        const groupData = { id: snap.id, ...snap.data() }
 
        if (user && user.email) {
          const myGhostProfile = groupData.members?.find(
            m => m.email && m.email.toLowerCase() === user.email.toLowerCase() && m.uid.startsWith('manual_')
          )
          if (myGhostProfile) {
            const updatedMembers = groupData.members.map(m =>
              m.uid === myGhostProfile.uid
                ? { ...m, uid: user.uid, photo: user.photoURL, name: user.displayName }
                : m
            )
            updateGroup(groupId, { members: updatedMembers })
            logActivity(groupId, `${user.displayName} joined the group via email invite!`)
            groupData.members = updatedMembers
          }
        }
 
        if (groupData.budget) setBudget(groupData.budget)
        setGroup(groupData)
      }
      setGroupLoading(false)
    }
    fetchGroup()
 
    const unsubActivity = subscribeToActivity(groupId, setActivities)
    return () => unsubActivity()
  }, [groupId, user])
 
  // ── Handlers ──────────────────────────────────────────────────
 
  const handleAddMemberClick  = () => { setEditingMember(null); setShowAddMember(true) }
  const handleEditMemberClick = (m) => { setEditingMember(m); setShowAddMember(true) }
  const handleCloseMemberModal = () => { setShowAddMember(false); setEditingMember(null) }
 
  const handleEdit      = useCallback((e) => { setEditingExp(e); setShowForm(true) }, [])
  const handleCloseForm = useCallback(() => { setShowForm(false); setEditingExp(null) }, [])
 
  const handleDeleteSettlement = async (settlement) => {
    if (!confirm(`Delete the ₹${settlement.amount} payment from ${settlement.fromName} to ${settlement.toName}?`)) return
    try {
      await deleteSettlement(groupId, settlement.id)
      const userName = user?.displayName?.split(' ')[0] || 'A member'
      await logActivity(groupId, `🗑️ ${userName} deleted the settlement: ${settlement.fromName} paid ₹${settlement.amount} to ${settlement.toName}.`)
      toast.success('Settlement deleted')
    } catch {
      toast.error('Failed to delete settlement')
    }
  }
 
  // ✨ Save budget
  const handleSaveBudget = async () => {
    const val = Number(budgetInput)
    if (!val || val <= 0) return toast.error('Enter a valid budget amount')
    try {
      await updateGroup(groupId, { budget: val })
      setBudget(val)
      setShowBudget(false)
      setBudgetInput('')
      await logActivity(groupId, `🎯 ${user.displayName} set a group budget of ₹${val.toLocaleString('en-IN')}.`)
      toast.success('Budget set!')
    } catch {
      toast.error('Failed to save budget')
    }
  }
 
  const handleRemoveBudget = async () => {
    await updateGroup(groupId, { budget: null })
    setBudget('')
    toast.success('Budget removed')
  }
 
  // Export CSV
  const exportToCSV = () => {
    setShowMenu(false)
    if (expenses.length === 0) return toast.error('No expenses to export')
    const rows = [
      ['Title', 'Amount (₹)', 'Paid By', 'Category', 'Date', 'Notes', 'Split Among', 'Per Person'],
      ...expenses.map((e) => {
        const paidByName = group.members.find(m => m.uid === e.paidBy)?.name || 'Unknown'
        const splitNames = e.splitAmong?.map(s =>
          group.members.find(m => m.uid === s.uid)?.name || 'Unknown'
        ).join(' | ') || ''
        const perPerson = e.splitAmong?.length
          ? (Number(e.amount) / e.splitAmong.length).toFixed(2)
          : e.amount
        const date = e.createdAt
          ? new Date(e.createdAt.seconds * 1000).toLocaleDateString('en-IN') : ''
        return [e.title, e.amount, paidByName, e.category || 'Other', date, e.notes || '', splitNames, perPerson]
      })
    ]
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${group.name}-expenses.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${expenses.length} expenses!`)
  }
 
  // Leave group
 // Leave group
  const handleLeaveGroup = async () => {
    setShowMenu(false)

    // ✨ NEW: Prevent leaving if they have active debts or credits
    if (Math.abs(myBalance) > 0.01) {
      toast.error('You cannot leave the group until all your balances are settled!')
      return
    }

    if (!confirm(`Are you sure you want to leave "${group.name}"?`)) return
    
    const updatedMembers = group.members.filter(m => m.uid !== user.uid)
    try {
      await updateGroup(groupId, { members: updatedMembers })
      await logActivity(groupId, `👋 ${user.displayName} left the group.`)
      toast.success('You left the group')
      navigate('/dashboard')
    } catch {
      toast.error('Failed to leave group')
    }
  }
 
  // ✨ useMemo — search + category filter combined
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesCategory = !filter || e.category === filter
      const matchesSearch   = !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [expenses, filter, searchQuery])
 
  // ✨ Budget calculations
  const budgetNum     = Number(budget)
  const budgetUsed    = budgetNum > 0 ? Math.min((totalExpenses / budgetNum) * 100, 100) : 0
  const budgetOver    = budgetNum > 0 && totalExpenses > budgetNum
  const budgetWarning = budgetNum > 0 && !budgetOver && budgetUsed >= 80
 
  const myBalance = netBalances[user?.uid] || 0
 
  if (groupLoading) return <Loader fullscreen />
  if (!group)       return <div className="p-8 text-slate-400">Group not found.</div>
 
  return (
    <div className="p-6 max-w-4xl mx-auto">
 
      {/* ── Header ── */}
      <div className="flex items-start gap-4 mb-6 animate-fade-up">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2 mt-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-extrabold text-2xl text-white">{group.name}</h1>
          <p className="text-slate-500 text-sm font-body mt-0.5">
            {group.members?.length} members · {expenses.length} expenses
          </p>
        </div>
        <div className={`flex-shrink-0 px-4 py-2 rounded-xl border font-mono font-semibold text-sm
          ${myBalance > 0.01  ? 'border-brand-500/40 bg-brand-500/10 text-brand-400' :
            myBalance < -0.01 ? 'border-red-500/40 bg-red-500/10 text-red-400' :
                                'border-surface-border text-slate-400'}`}>
          {myBalance > 0.01  ? `+₹${myBalance.toFixed(0)} owed to you` :
           myBalance < -0.01 ? `-₹${Math.abs(myBalance).toFixed(0)} you owe` :
                               'All settled'}
        </div>
      </div>
 
      {/* ✨ Budget Alert Bar */}
      {budgetNum > 0 && (
        <div className={`card p-4 mb-5 animate-fade-in ${budgetOver ? 'border-red-500/40' : budgetWarning ? 'border-yellow-500/40' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {budgetOver
                ? <AlertTriangle size={16} className="text-red-400" />
                : <Target size={16} className="text-brand-400" />}
              <span className="text-sm font-display font-semibold text-white">
                {budgetOver ? 'Over Budget!' : budgetWarning ? 'Approaching Budget Limit' : 'Group Budget'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                ₹{totalExpenses.toLocaleString('en-IN')} / ₹{budgetNum.toLocaleString('en-IN')}
              </span>
              <button onClick={handleRemoveBudget} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                Remove
              </button>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-DEFAULT rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetOver ? 'bg-red-500' : budgetWarning ? 'bg-yellow-500' : 'bg-brand-500'
              }`}
              style={{ width: `${budgetUsed}%` }}
            />
          </div>
          {budgetOver && (
            <p className="text-xs text-red-400 mt-1.5 font-mono">
              ₹{(totalExpenses - budgetNum).toLocaleString('en-IN')} over budget
            </p>
          )}
        </div>
      )}
 
      {/* ✨ Set Budget inline panel */}
      {showBudget && (
        <div className="card p-4 mb-5 border-brand-500/30 animate-fade-in">
          <p className="label mb-2">Set Group Budget (₹)</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="e.g. 50000"
              className="input"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveBudget()}
            />
            <button onClick={handleSaveBudget} className="btn-primary flex-shrink-0">Save</button>
            <button onClick={() => setShowBudget(false)} className="btn-ghost flex-shrink-0">Cancel</button>
          </div>
        </div>
      )}
 
      {/* ── Members row + actions ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex -space-x-2">
          {group.members?.map((m) => (
            <img
              key={m.uid}
              src={m.photo || `https://ui-avatars.com/api/?name=${m.name}&background=1e2535&color=94a3b8`}
              alt={m.name}
              title={`Edit ${m.name}`}
              onClick={() => handleEditMemberClick(m)}
              className="w-9 h-9 rounded-full ring-2 ring-surface object-cover cursor-pointer hover:ring-brand-400 hover:z-10 transition-all"
            />
          ))}
        </div>
 
        <div className="flex gap-2 items-center">
          {/* ✨ Search toggle */}
          <button
            onClick={() => { setShowSearch(v => !v); setSearchQuery('') }}
            className={`btn-ghost p-2 rounded-xl ${showSearch ? 'text-brand-400 bg-brand-500/10' : ''}`}
            title="Search expenses"
          >
            <Search size={18} />
          </button>
 
          {/* ⋮ More options */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(v => !v)} className="btn-ghost p-2 rounded-xl" title="More options">
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-11 z-20 w-48 bg-surface-card border border-surface-border rounded-xl shadow-xl py-1 animate-fade-in">
                <button
                  onClick={() => { setShowMenu(false); setShowBudget(true); setActiveTab('expenses') }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-hover transition-colors"
                >
                  <Target size={15} /> {budget ? 'Update Budget' : 'Set Budget'}
                </button>
                <button
                  onClick={exportToCSV}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-hover transition-colors"
                >
                  <Download size={15} /> Export CSV
                </button>
                <div className="border-t border-surface-border my-1" />
                <button
                  onClick={handleLeaveGroup}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-b-xl"
                >
                  <LogOut size={15} /> Leave Group
                </button>
              </div>
            )}
          </div>
 
          <button onClick={handleAddMemberClick} className="btn-ghost text-sm">
            <UserPlus size={15} /> Add Member
          </button>
 
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>
 
      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-xl mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200
              ${activeTab === id ? 'bg-brand-500/15 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
 
      {/* ── Tab: Expenses ── */}
      {activeTab === 'expenses' && (
        <div className="flex flex-col gap-3">
 
          {/* ✨ Search bar */}
          {showSearch && (
            <div className="relative animate-fade-in">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or notes…"
                className="input pl-9"
                autoFocus
              />
            </div>
          )}
 
          {/* Category filter */}
          {expenses.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {['', 'Food', 'Travel', 'Rent', 'Utilities', 'Fun', 'Shopping', 'Other'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-body transition-all border
                    ${filter === cat
                      ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                      : 'border-surface-border text-slate-500 hover:border-slate-500'}`}
                >
                  {cat || 'All'}
                </button>
              ))}
            </div>
          )}
 
          {expLoading ? <Loader /> : filteredExpenses.length === 0 ? (
            <EmptyState
              icon={searchQuery ? Search : Receipt}
              title={searchQuery ? 'No results found' : 'No expenses yet'}
              description={searchQuery ? `No expenses match "${searchQuery}"` : 'Add the first expense for this group.'}
              action={!searchQuery && (
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  <Plus size={18} /> Add Expense
                </button>
              )}
            />
          ) : (
            filteredExpenses.map((e) => (
              <ExpenseCard
                key={e.id}
                expense={e}
                groupId={groupId}
                members={group.members}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>
      )}
 
      {/* ── Tab: Balances ── */}
      {activeTab === 'balances' && (
        <BalanceSummary transactions={transactions} members={group.members || []} groupId={groupId} />
      )}
 
      {/* ── Tab: Analytics ── */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboard expenses={expenses} members={group.members || []} totalExpenses={totalExpenses} />
      )}
 
      {/* ── Tab: Audit Trail ── */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-4">
          {settlements.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Settlements</p>
              <div className="flex flex-col gap-2">
                {settlements.map((s) => (
                  <div key={s.id} className="bg-surface-card border border-surface-border p-3 rounded-xl flex items-center justify-between animate-fade-in">
                    <p className="text-sm text-slate-300 font-body">
                      <span className="text-red-400 font-medium">{s.fromName}</span>{' '}paid{' '}
                      <span className="text-brand-400 font-medium">{s.toName}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-white">₹{s.amount?.toLocaleString('en-IN')}</span>
                      <button onClick={() => handleDeleteSettlement(s)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
 
          <div>
            <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity size={14} /> Activity Log
            </p>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-500 p-4 text-center">No activity recorded yet.</p>
            ) : (
              <div className="flex flex-col border-l-2 border-surface-border ml-2 pl-4 gap-4 py-2">
                {activities.map(act => (
                  <div key={act.id} className="relative animate-fade-in">
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-brand-500 ring-4 ring-surface" />
                    <p className="text-sm text-slate-300 font-body leading-relaxed">{act.text}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {act.createdAt ? new Date(act.createdAt.seconds * 1000).toLocaleString('en-IN') : 'Just now'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
 
      {/* ── Modals ── */}
      <ExpenseForm
        isOpen={showForm}
        onClose={handleCloseForm}
        groupId={groupId}
        members={group.members || []}
        editingExpense={editingExp}
      />
      <AddMemberModal
        isOpen={showAddMember}
        onClose={handleCloseMemberModal}
        group={group}
        setGroup={setGroup}
        editingMember={editingMember}
        expenses={expenses}
      />
    </div>
  )
}
 