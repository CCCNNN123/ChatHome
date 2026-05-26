import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { MessageSquare, Bot, Database, LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

const navItems: NavItem[] = [
  { to: '/', icon: MessageSquare, label: '聊天室' },
  { to: '/ai', icon: Bot, label: 'AI 助手' },
  { to: '/knowledge', icon: Database, label: '知识库' },
]

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex w-16 flex-col items-center border-r border-gray-200/50 bg-white/60 backdrop-blur-xl py-4">
      <div className="mb-8 mt-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 shadow-[0_4px_14px_rgba(0,0,0,0.3)]">
        <span className="text-xs font-bold text-white">CH</span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300',
                isActive
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-[0_4px_14px_rgba(0,0,0,0.35)]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/80'
              )
            }
            title={item.label}
          >
            {({ isActive }) => (
              <>
                <item.icon className="h-5 w-5" />
                <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-all duration-300 hover:text-red-500 hover:bg-red-50 group relative"
        title="退出登录"
      >
        <LogOut className="h-4 w-4" />
        <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          退出登录
        </div>
      </button>
    </aside>
  )
}
