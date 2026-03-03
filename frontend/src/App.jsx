import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import NewApplication from './pages/NewApplication'
import { 
  HomeIcon, 
  ListIcon, 
  PlusIcon, 
  LogoIcon 
} from './components/Icons'
import './index.css'

function AppLayout() {
  const location = useLocation()
  
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

  return (
    <div className="app">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <LogoIcon size="md" style={{ color: 'white' }} />
            <span>面试记录</span>
          </div>
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
      </aside>

      {/* 顶部栏 */}
      <header className="header">
        <div className="header-left">
          <h1 className="header-title">{getPageTitle()}</h1>
        </div>
        <div className="header-right">
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/new" element={<NewApplication />} />
          <Route path="/edit/:id" element={<NewApplication />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App