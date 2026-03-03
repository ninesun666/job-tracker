/**
 * 用户个人中心页面
 * 显示用户信息、统计数据、登出功能
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserIcon, BriefcaseIcon, CalendarIcon, CheckCircleIcon, GiftIcon } from '../components/Icons'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // 用户统计数据（这里可以从 API 获取）
  const stats = [
    { label: '总投递', value: 0, icon: BriefcaseIcon, color: 'blue' },
    { label: '本周投递', value: 0, icon: CalendarIcon, color: 'green' },
    { label: '面试中', value: 0, icon: CheckCircleIcon, color: 'orange' },
    { label: '已获Offer', value: 0, icon: GiftIcon, color: 'purple' }
  ]

  return (
    <div className="profile-page">
      {/* 用户信息卡片 */}
      <div className="profile-card">
        <div className="profile-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="avatar-image" />
          ) : (
            <div className="avatar-placeholder">
              <UserIcon size="lg" />
            </div>
          )}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{user?.name || user?.github_username || '用户'}</h2>
          <p className="profile-email">{user?.email || '未设置邮箱'}</p>
          {user?.github_username && (
            <a 
              href={`https://github.com/${user.github_username}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="profile-github"
            >
              @{user.github_username}
            </a>
          )}
        </div>
      </div>

      {/* 统计数据 */}
      <div className="profile-stats">
        <h3 className="section-title">我的统计</h3>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-item stat-${stat.color}`}>
              <stat.icon size="sm" className="stat-icon" />
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 操作菜单 */}
      <div className="profile-menu">
        <h3 className="section-title">设置</h3>
        <div className="menu-list">
          <button className="menu-item" onClick={() => navigate('/applications')}>
            <span className="menu-icon">📋</span>
            <span className="menu-text">我的投递记录</span>
            <span className="menu-arrow">›</span>
          </button>
          <button className="menu-item menu-danger" onClick={handleLogout}>
            <span className="menu-icon">🚪</span>
            <span className="menu-text">退出登录</span>
            <span className="menu-arrow">›</span>
          </button>
        </div>
      </div>

      {/* 版本信息 */}
      <div className="profile-footer">
        <p>面试投递记录平台 v2.0</p>
        <p className="footer-hint">Powered by React + Node.js</p>
      </div>
    </div>
  )
}
