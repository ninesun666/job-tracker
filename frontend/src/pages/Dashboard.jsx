import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  ChartIcon, 
  CalendarIcon, 
  CalendarWeekIcon,
  BriefcaseIcon,
  GiftIcon,
  XCircleIcon,
  FileTextIcon,
  DownloadIcon,
  PlusIcon,
  InboxIcon,
  ArrowRightIcon
} from '../components/Icons'

function Dashboard() {
  const { api, user } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0,
    thisWeek: 0,
    thisMonth: 0
  })
  const [recentApplications, setRecentApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        api.get('/jobs/stats/overview'),
        api.get('/jobs?limit=5')
      ])
      
      if (statsRes.data.success) {
        setStats(statsRes.data.data)
      }
      if (appsRes.data.success) {
        setRecentApplications(appsRes.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = async () => {
    try {
      const response = await api.get('/export/excel', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `面试投递记录_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('导出失败：' + err.message)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { class: 'status-pending', text: '待处理' },
      applied: { class: 'status-applied', text: '已投递' },
      interviewing: { class: 'status-interviewing', text: '面试中' },
      offered: { class: 'status-offered', text: '已获Offer' },
      rejected: { class: 'status-rejected', text: '已拒绝' },
      withdrawn: { class: 'status-withdrawn', text: '已撤回' }
    }
    return configs[status] || configs.pending
  }

  const statCards = [
    { icon: ChartIcon, label: '总投递数', value: stats.total, color: 'blue' },
    { icon: CalendarWeekIcon, label: '本周投递', value: stats.thisWeek, color: 'blue' },
    { icon: CalendarIcon, label: '本月投递', value: stats.thisMonth, color: 'blue' },
    { icon: BriefcaseIcon, label: '面试中', value: stats.interviewing, color: 'green' },
    { icon: GiftIcon, label: '已获Offer', value: stats.offered, color: 'green' },
    { icon: XCircleIcon, label: '已拒绝', value: stats.rejected, color: 'red' },
  ]

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    )
  }

  return (
    <div>
      {/* 页面标题区 */}
      <div className="page-header">
        <div>
          <h2 className="page-title">数据概览</h2>
          <p className="page-subtitle">追踪你的求职进度</p>
        </div>
        <div className="page-actions">
          <button onClick={exportExcel} className="btn btn-secondary">
            <DownloadIcon size="sm" />
            导出Excel
          </button>
          <Link to="/new" className="btn btn-primary">
            <PlusIcon size="sm" />
            新建记录
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-card-icon ${stat.color}`}>
              <stat.icon size="lg" />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 最近投递 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FileTextIcon size="sm" className="card-title-icon" />
            最近投递
          </h3>
          <Link to="/applications" className="btn btn-sm btn-ghost">
            查看全部 <ArrowRightIcon size="sm" />
          </Link>
        </div>
        
        {recentApplications.length === 0 ? (
          <div className="empty-state">
            <InboxIcon size="xl" style={{ color: 'var(--text-placeholder)', marginBottom: 16 }} />
            <div className="empty-title">暂无投递记录</div>
            <div className="empty-desc">开始记录你的求职之旅</div>
            <Link to="/new" className="btn btn-primary" style={{ marginTop: 16 }}>
              <PlusIcon size="sm" />
              开始记录
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>公司</th>
                  <th>岗位</th>
                  <th>投递时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map(app => {
                  const statusConfig = getStatusConfig(app.status)
                  return (
                    <tr key={app.id}>
                      <td>
                        <span className="table-cell-primary">{app.company_name}</span>
                        {app.company_scale && (
                          <span style={{ 
                            color: 'var(--text-placeholder)', 
                            marginLeft: 8, 
                            fontSize: '12px' 
                          }}>
                            {app.company_scale}
                          </span>
                        )}
                      </td>
                      <td>{app.position}</td>
                      <td className="table-cell-secondary">{app.apply_date}</td>
                      <td>
                        <span className={`status ${statusConfig.class}`}>
                          <span className="status-dot"></span>
                          {statusConfig.text}
                        </span>
                      </td>
                      <td>
                        <Link to={`/edit/${app.id}`} className="btn btn-sm btn-ghost">
                          编辑
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
