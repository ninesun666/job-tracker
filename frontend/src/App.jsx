import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import NewApplication from './pages/NewApplication'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Profile from './pages/Profile'
import MobileNav from './components/MobileNav'
import { 
  HomeIcon, 
  ListIcon, 
  PlusIcon, 
  LogoIcon,
  GithubIcon,
  UserIcon,
  MenuIcon,
  CloseIcon
} from './components/Icons'
import './index.css'

// 路由守卫组件
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// 公共路由组件（已登录用户访问登录页时跳转到首页）
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function AppLayout() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const navItems = [
    { path: '/', icon: HomeIcon, label: '仪表盘' },
    { path: '/applications', icon: ListIcon, label: '投递记录' },
    { path: '/new', icon: PlusIcon, label: '新建记录' },
  ]

  const getPageTitle = () => {
    if (location.pathname === '/') return '仪表盘'
    if (location.pathname === '/applications') return '投递记录'
    if (location.pathname === '/new') return '新建记录'
    if (location.pathname.startsWith('/edit/')) return '编辑记录'
    return '面试投递记录'
  }
  
  // 路由变化时关闭移动端菜单
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className={`app ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* 移动端遮罩 */}
      {isMobile && isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* 侧边栏 */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <LogoIcon size="md" style={{ color: 'white' }} />
            <span>面试记录</span>
          </div>
          {isMobile && (
            <button className="sidebar-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
              <CloseIcon size="sm" />
            </button>
          )}
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">导航</div>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.path === '/'}
              >
                <item.icon size="sm" className="nav-item-icon" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* 用户信息 */}
        <div className="sidebar-user">
          <div className="user-info">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">
                <UserIcon size="sm" />
              </div>
            )}
            <div className="user-details">
              <span className="user-name">{user?.name || user?.github_username || '用户'}</span>
              <span className="user-email" style={{ color: 'rgba(255,255,255,0.85)' }}>{user?.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="登出">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* 顶部栏 */}
      <header className="header">
        <div className="header-left">
          {isMobile && (
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <MenuIcon size="md" />
            </button>
          )}
          <h1 className="header-title">{getPageTitle()}</h1>
        </div>
        <div className="header-right">
          {!isMobile && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className={`main ${isMobile ? 'mobile-main' : ''}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/new" element={<NewApplication />} />
          <Route path="/edit/:id" element={<NewApplication />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      
      {/* 移动端底部导航 */}
      {isMobile && <MobileNav />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* 公共路由 */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* 受保护路由 */}
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
