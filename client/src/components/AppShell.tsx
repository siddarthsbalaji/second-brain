import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ThemeToggle } from './ThemeToggle'
import {
  Brain,
  LayoutDashboard,
  CheckSquare,
  Flame,
  Calendar,
  FileText,
  BookOpen,
  Search,
  Sparkles,
  LogOut,
  User as UserIcon,
  Blocks,
} from 'lucide-react'
import { usePlugins, PluginHeaderSlots } from '../context/PluginContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-violet-100 font-semibold text-violet-900 dark:bg-violet-900/40 dark:text-violet-200 shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`

export function AppShell({
  title,
  wide,
  children,
}: {
  title?: string
  wide?: boolean
  children: ReactNode
}) {
  const { user, logout } = useAuth()
  const maxW = wide ? 'max-w-7xl' : 'max-w-4xl'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <AppHeader user={user} onLogout={logout} title={title} />
      <main className={`mx-auto ${maxW} px-4 py-8`}>
        {children}
      </main>
    </div>
  )
}

export function AppHeader({
  user,
  onLogout,
  title,
}: {
  user?: { email: string; username?: string } | null
  onLogout: () => void
  title?: string
}) {
  const displayName = user?.username || user?.email?.split('@')[0] || ''
  const { openManager } = usePlugins()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex w-full max-w-[96%] 2xl:max-w-[1536px] flex-wrap items-center justify-between gap-3 py-3.5">
        {/* Brand & Nav items */}
        <div className="flex flex-wrap items-center gap-4">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-base font-bold text-violet-700 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-500/30">
              <Brain className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline">Second Brain</span>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navClass}>
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Home</span>
            </NavLink>
            <NavLink to="/tasks" className={navClass}>
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Tasks</span>
            </NavLink>
            <NavLink to="/habits" className={navClass}>
              <Flame className="h-3.5 w-3.5" />
              <span>Habits</span>
            </NavLink>
            <NavLink to="/calendar" className={navClass}>
              <Calendar className="h-3.5 w-3.5" />
              <span>Calendar</span>
            </NavLink>
            <NavLink to="/notes" className={navClass}>
              <FileText className="h-3.5 w-3.5" />
              <span>Notes</span>
            </NavLink>
            <NavLink to="/journal" className={navClass}>
              <BookOpen className="h-3.5 w-3.5" />
              <span>Journal</span>
            </NavLink>
            <NavLink to="/search" className={navClass}>
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </NavLink>
            <NavLink
              to="/lumen"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-100 font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 shadow-sm'
                    : 'text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30'
                }`
              }
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>Lumen</span>
            </NavLink>
          </nav>
        </div>

        {/* User profile & controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Plugin Header Actions */}
          <PluginHeaderSlots />

          {/* Plugins Manager Trigger Button */}
          <button
            type="button"
            onClick={openManager}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-violet-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-violet-400"
            title="Configure Plugins"
          >
            <Blocks className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span className="hidden md:inline">Plugins</span>
          </button>

          <ThemeToggle />

          {title && (
            <span className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">{title}</span>
          )}

          {user && (
            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
              <UserIcon className="h-3.5 w-3.5 text-violet-500" />
              <span className="max-w-[150px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                {displayName || user.email}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-rose-400"
            title="Sign out of account"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  )
}