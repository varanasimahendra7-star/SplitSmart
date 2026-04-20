// src/components/analytics/AnalyticsDashboard.jsx
import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts'
import { getCategoryBreakdown, getSpendingByMember, getDailyTrend } from '../../utils/debtSimplifier'
import { TrendingUp, Award, PieChart as PieIcon } from 'lucide-react'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']

export function AnalyticsDashboard({ expenses, members, totalExpenses }) {
  // useMemo — all chart data computed only when expenses/members change
  const categoryData = useMemo(() => getCategoryBreakdown(expenses), [expenses])
  const memberData   = useMemo(() => getSpendingByMember(expenses, members), [expenses, members])
  const trendData    = useMemo(() => getDailyTrend(expenses), [expenses])

  const topSpender = memberData[0]

  if (expenses.length === 0) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <PieIcon size={32} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 font-body">Add expenses to see spending insights.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Spent"
          value={`₹${totalExpenses.toLocaleString('en-IN')}`}
          sub={`across ${expenses.length} expenses`}
        />
        <StatCard
          label="Avg per Expense"
          value={`₹${(totalExpenses / expenses.length).toFixed(0)}`}
          sub="per transaction"
        />
        <StatCard
          label="Top Category"
          value={categoryData[0]?.category || '—'}
          sub={categoryData[0] ? `₹${categoryData[0].total.toLocaleString('en-IN')}` : ''}
        />
      </div>

      {/* Top spender banner */}
      {topSpender && (
        <div className="card p-4 flex items-center gap-3 border-brand-500/30">
          <Award size={20} className="text-brand-400 flex-shrink-0" />
          <p className="text-sm font-body text-slate-300">
            <span className="text-white font-semibold">{topSpender.name}</span> paid the most —{' '}
            <span className="text-brand-400 font-mono">₹{topSpender.total.toLocaleString('en-IN')}</span>
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="card p-5">
          <p className="label mb-4 flex items-center gap-2"><PieIcon size={14} />By Category</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={({ category }) => category}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Spent']}
                contentStyle={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Per member */}
        <div className="card p-5">
          <p className="label mb-4 flex items-center gap-2"><Award size={14} />By Member</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={memberData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Paid']}
                contentStyle={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: 8 }}
              />
              <Bar dataKey="total" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend */}
      {trendData.length > 1 && (
        <div className="card p-5">
          <p className="label mb-4 flex items-center gap-2"><TrendingUp size={14} />Daily Spend Trend</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Spent']}
                contentStyle={{ background: '#161b27', border: '1px solid #1e2535', borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="card p-4 animate-fade-up">
      <p className="label">{label}</p>
      <p className="font-display font-bold text-white text-2xl">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}