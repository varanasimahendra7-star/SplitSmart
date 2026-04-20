// src/components/settlements/BalanceSummary.jsx
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { addSettlement, logActivity } from '../../services/expenseService'
import toast from 'react-hot-toast'
import { ArrowRight, CheckCircle2, User, HelpCircle } from 'lucide-react'

export function BalanceSummary({ transactions, members, groupId }) {
  const { user } = useAuth()
  const [settling, setSettling] = useState(null)

  // Helper to get names and photos safely
  const getMember = (uid) => members.find((m) => m.uid === uid) || { name: 'Unknown member' }

  // ✨ THE MAGIC: Filter the math based on who is looking at the screen!
  const myDebts = transactions.filter((t) => t.from === user?.uid)
  const owedToMe = transactions.filter((t) => t.to === user?.uid)
  const otherDebts = transactions.filter((t) => t.from !== user?.uid && t.to !== user?.uid)

  const handleSettle = async (transaction) => {
    const toMember = getMember(transaction.to)
    if (!window.confirm(`Mark ₹${transaction.amount} as paid to ${toMember.name}?`)) return
    
    setSettling(transaction.from + transaction.to) // Loading state key
    
    try {
      // 1. Save the settlement to Firebase
      await addSettlement(groupId, {
        from: user.uid,
        to: transaction.to,
        fromName: user.displayName || 'A member',
        toName: toMember.name,
        amount: transaction.amount
      })
      
      // 2. Drop a log in the Audit Trail
      await logActivity(groupId, `${user.displayName} settled a debt of ₹${transaction.amount} with ${toMember.name}.`)
      
      toast.success(`You paid ${toMember.name}!`)
    } catch (err) {
      toast.error('Failed to settle debt')
    } finally {
      setSettling(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="card p-8 text-center animate-fade-in flex flex-col items-center">
        <CheckCircle2 size={36} className="text-brand-400 mb-3" />
        <h3 className="text-lg font-display font-bold text-white mb-1">You are all settled up!</h3>
        <p className="text-slate-500 font-body text-sm">There are no outstanding debts in this group.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* 🔴 SECTION 1: What YOU owe (Action Required) */}
      {myDebts.length > 0 && (
        <div>
          <h3 className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Action Required: You Owe
          </h3>
          <div className="flex flex-col gap-2">
            {myDebts.map((t, idx) => {
              const toMember = getMember(t.to)
              const isSettling = settling === t.from + t.to

              return (
                <div key={idx} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={toMember.photo || `https://ui-avatars.com/api/?name=${toMember.name}&background=1e2535&color=94a3b8`} 
                      alt={toMember.name} 
                      className="w-10 h-10 rounded-full ring-2 ring-red-500/30"
                    />
                    <div>
                      <p className="text-sm font-body text-slate-300">You owe <span className="text-white font-medium">{toMember.name}</span></p>
                      <p className="text-lg font-mono font-bold text-red-400 mt-0.5">₹{t.amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSettle(t)}
                    disabled={isSettling}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
                  >
                    {isSettling ? 'Processing...' : 'Settle Up'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 🟢 SECTION 2: What is owed to YOU */}
      {owedToMe.length > 0 && (
        <div>
          <h3 className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Waiting On: Owed to You
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {owedToMe.map((t, idx) => {
              const fromMember = getMember(t.from)
              return (
                <div key={idx} className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl flex items-center gap-3">
                  <img 
                    src={fromMember.photo || `https://ui-avatars.com/api/?name=${fromMember.name}&background=1e2535&color=94a3b8`} 
                    alt={fromMember.name} 
                    className="w-10 h-10 rounded-full ring-2 ring-brand-500/30"
                  />
                  <div>
                    <p className="text-sm font-body text-slate-300"><span className="text-white font-medium">{fromMember.name}</span> owes you</p>
                    <p className="text-lg font-mono font-bold text-brand-400 mt-0.5">₹{t.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ⚪ SECTION 3: Everyone Else's Debts */}
      {otherDebts.length > 0 && (
        <div>
          <h3 className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Other Group Debts
          </h3>
          <div className="flex flex-col gap-2">
            {otherDebts.map((t, idx) => {
              const fromMember = getMember(t.from)
              const toMember = getMember(t.to)
              
              return (
                <div key={idx} className="bg-surface-card border border-surface-border p-3 rounded-xl flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-300">{fromMember.name}</span>
                    <ArrowRight size={14} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-300">{toMember.name}</span>
                  </div>
                  <span className="font-mono text-slate-400">₹{t.amount.toLocaleString('en-IN')}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}