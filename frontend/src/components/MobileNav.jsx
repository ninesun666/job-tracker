/**
 * 移动端底部导航栏组件
 * 在小屏幕设备上显示，提供便捷的导航操作
 */
import React from 'react'
import { NavLink } from 'react-router-dom'
import { HomeIcon, ListIcon, PlusIcon, UserIcon } from './Icons'

const navItems = [
  { path: '/', icon: HomeIcon, label: '首页' },
  { path: '/applications', icon: ListIcon, label: '记录' },
  { path: '/new', icon: PlusIcon, label: '新建', isMain: true },
  { path: '/profile', icon: UserIcon, label: '我的' }
]

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            `mobile-nav-item ${isActive ? 'active' : ''} ${item.isMain ? 'main-action' : ''}`
          }
          end={item.path === '/'}
        >
          <div className={`mobile-nav-icon ${item.isMain ? 'main-icon' : ''}`}>
            <item.icon size={item.isMain ? 'lg' : 'md'} />
          </div>
          {!item.isMain && <span className="mobile-nav-label">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}
