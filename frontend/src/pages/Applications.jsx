import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  ListIcon, 
  DownloadIcon, 
  PlusIcon, 
  InboxIcon,
  EditIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '../components/Icons'

const API_BASE = '/api'

function Applications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    company: '',
    status: '',
    page: 1
  })
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchApplications()
  }, [filters])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.company) params.append('company', filters.company)
      if (filters.status) params.append('status', filters.status)
      params.append('page', filters.page)
      params.append('limit', 20)

      const res = await axios.get(`${API_BASE}/jobs?${params}`)
      
      if (res.data.success) {
        setApplications(res.data.data)
        setPagination(res.data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteApplication = async (id) => {
    if (!window.confirm('确定要删除这条记录吗？')) return
    
    try {
      await axios.delete(`${API_BASE}/jobs/${id}`)
      fetchApplications()
    } catch (err) {
      alert('删除失败：' + err.message)
    }
  }

  const exportExcel = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      
      const response = await axios.get(`${API_BASE}/export/excel?${params}`, {
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

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'applied', label: '已投递' },
    { value: 'interviewing', label: '面试中' },
    { value: 'offered', label: '已获Offer' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'withdrawn', label: '已撤回' },
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

      {/* 筛选工具栏 */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <input
            type="text"
            className="search-input"
            placeholder="搜索公司名称..."
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value, page: 1 })}
          />
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 表格卡片 */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>加载中...</span>
          </div>
        ) : applications.length === 0 ? (
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
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>公司</th>
                  <th>规模</th>
                  <th>上市</th>
                  <th>岗位</th>
                  <th>薪资</th>
                  <th>地点</th>
                  <th>投递时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => {
                  const statusConfig = getStatusConfig(app.status)
                  return (
                    <tr key={app.id}>
                      <td><span className="table-cell-primary">{app.company_name}</span></td>
                      <td className="table-cell-secondary">{app.company_scale || '-'}</td>
                      <td className="table-cell-secondary">{app.company_stock || '-'}</td>
                      <td>{app.position}</td>
                      <td className="table-cell-secondary">{app.salary_range || '-'}</td>
                      <td className="table-cell-secondary">{app.location || '-'}</td>
                      <td className="table-cell-secondary">{app.apply_date}</td>
                      <td>
                        <span className={`status ${statusConfig.class}`}>
                          <span className="status-dot"></span>
                          {statusConfig.text}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Link to={`/edit/${app.id}`} className="btn btn-sm btn-ghost">
                            <EditIcon size="sm" />
                            编辑
                          </Link>
                          <button 
                            onClick={() => deleteApplication(app.id)} 
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--danger)' }}
                          >
                            <TrashIcon size="sm" />
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {pagination.pages > 1 && (
          <div className="pagination" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
            <button
              className="pagination-btn"
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              <ArrowLeftIcon size="sm" />
              上一页
            </button>
            <span className="pagination-info">
              {filters.page} / {pagination.pages}
            </span>
            <button
              className="pagination-btn"
              disabled={filters.page === pagination.pages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              下一页
              <ArrowRightIcon size="sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Applications