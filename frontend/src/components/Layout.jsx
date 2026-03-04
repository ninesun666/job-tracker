import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  ScanLine,
  BarChart3,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘', end: true },
  { to: '/jobs', icon: Briefcase, label: '投递记录' },
  { to: '/scan', icon: ScanLine, label: 'AI识图' },
  { to: '/stats', icon: BarChart3, label: '统计分析' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <h1 className="text-xl font-bold text-primary-600">
            📋 Job Tracker
          </h1>
          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="p-4 space-y-2">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors duration-200
                ${isActive 
                  ? 'bg-primary-50 text-primary-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 底部信息 */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-gray-400 text-center">
            v1.0.0 | Made with ❤️
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="lg:ml-64">
        {/* 顶部栏 */}
        <header className="h-16 bg-white shadow-sm flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">
              面试投递记录平台
            </span>
            {/* 用户信息 */}
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3370ff&color=fff`}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-gray-700">{user?.name || '用户'}</span>
                <span className="text-xs text-gray-400">{user?.email || ''}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                title="退出登录"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}