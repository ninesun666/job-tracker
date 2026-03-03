import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  SearchIcon, 
  EditIcon, 
  TrashIcon,
  InboxIcon,
  FilterIcon
} from '../components/Icons'

function Applications() {
  const { api } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchApplications()
  }, [pagination.page, statusFilter])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      })
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('company', searchTerm)
      
      const response = await api.get(`/jobs?${params}`)
      if (response.data.success) {
        setApplications(response.data.data)
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }))
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchApplications()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这条记录吗？')) return
    
    try {
      await api.delete(`/jobs/${id}`)
      fetchApplications()
    } catch (err) {
      alert('删除失败：' + err.message)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { class: 'status-pending', text: '待处理', color: '#6b7280' },
      applied: { class: 'status-applied', text: '已投递', color: '#3b82f6' },
      interviewing: { class: 'status-interviewing', text: '面试中', color: '#10b981' },
      offered: { class: 'status-offered', text: '已获Offer', color: '#8b5cf6' },
      rejected: { class: 'status-rejected', text: '已拒绝', color: '#ef4444' },
      withdrawn: { class: 'status-withdrawn', text: '已撤回', color: '#9ca3af' }
    }
    return configs[status] || configs.pending
  }

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'applied', label: '已投递' },
    { value: 'interviewing', label: '面试中' },
    { value: 'offered', label: '已获Offer' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'withdrawn', label: '已撤回' }
  ]

  return (
    <div>
      {/* 页面标题区 */}
      <div className="page-header">
        <div>
          <h2 className="page-title">投递记录</h2>
          <p className="page-subtitle">共 {pagination.total} 条记录</p>
        </div>
        <div className="page-actions">
          <Link to="/new" className="btn btn-primary">
            新建记录
          </Link>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
            <div className="search-input" style={{ flex: 1 }}>
              <SearchIcon size="sm" />
              <input
                type="text"
                placeholder="搜索公司名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary">搜索</button>
          </form>
          
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            style={{ width: 'auto', minWidth: 120 }}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <InboxIcon size="xl" style={{ color: 'var(--text-placeholder)', marginBottom: 16 }} />
            <div className="empty-title">暂无投递记录</div>
            <div className="empty-desc">开始记录你的求职之旅</div>
            <Link to="/new" className="btn btn-primary" style={{ marginTop: 16 }}>
              新建记录
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 桌面端表格 */}
          <div className="card applications-table">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>公司</th>
                    <th>岗位</th>
                    <th>投递时间</th>
                    <th>状态</th>
                    <th>薪资范围</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => {
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
                        <td className="table-cell-secondary">{app.apply_date || '-'}</td>
                        <td>
                          <span className={`status ${statusConfig.class}`}>
                            <span className="status-dot"></span>
                            {statusConfig.text}
                          </span>
                        </td>
                        <td className="table-cell-secondary">{app.salary_range || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Link to={`/edit/${app.id}`} className="btn btn-sm btn-ghost">
                              <EditIcon size="sm" />
                            </Link>
                            <button 
                              className="btn btn-sm btn-ghost" 
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDelete(app.id)}
                            >
                              <TrashIcon size="sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 移动端卡片列表 */}
          <div className="applications-cards">
            {applications.map(app => {
              const statusConfig = getStatusConfig(app.status)
              return (
                <Link 
                  key={app.id} 
                  to={`/edit/${app.id}`}
                  className="application-card"
                >
                  <div className="card-header-row">
                    <div className="card-main-info">
                      <h3 className="card-company">{app.company_name}</h3>
                      <p className="card-position">{app.position}</p>
                    </div>
                    <span className={`status ${statusConfig.class}`}>
                      <span className="status-dot"></span>
                      {statusConfig.text}
                    </span>
                  </div>
                  
                  <div className="card-details">
                    {app.salary_range && (
                      <span className="card-detail-item">
                        💰 {app.salary_range}
                      </span>
                    )}
                    {app.location && (
                      <span className="card-detail-item">
                        📍 {app.location}
                      </span>
                    )}
                    {app.apply_date && (
                      <span className="card-detail-item">
                        📅 {app.apply_date}
                      </span>
                    )}
                  </div>

                  <div className="card-footer-row">
                    {app.company_scale && (
                      <span className="card-scale">{app.company_scale}</span>
                    )}
                    {app.source_platform && (
                      <span className="card-source">{app.source_platform}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* 分页 */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            ‹
          </button>
          <span className="pagination-info">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            className="pagination-btn"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}

export default Applications
