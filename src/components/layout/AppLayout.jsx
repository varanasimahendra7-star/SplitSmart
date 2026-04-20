// src/components/layout/AppLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, LogOut, Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/groups',    icon: Users,           label: 'My Groups'  },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-surface-border flex flex-col py-6 px-4 gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">SplitSmart</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-200
                ${isActive
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surface-hover'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-surface-border pt-4 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2">
            <img
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=22c55e&color=fff`}
              alt="avatar"
              className="w-8 h-8 rounded-full ring-2 ring-surface-border"
            />
            <div className="min-w-0">
              <p className="text-sm font-body font-medium text-slate-100 truncate">{user?.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost text-sm w-full justify-start text-slate-500">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}