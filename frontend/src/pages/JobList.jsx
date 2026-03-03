import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Edit2,
  Trash2,
  Eye,
  ChevronDown
} from 'lucide-react'
import axios from 'axios'

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    company: '',
    page: 1
  })
  const [pagination, setPagination] = useState({})
  const [selectedIds, setSelectedIds] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  
  const searchRef = useRef(null)

  useEffect(() => {
    loadJobs()
  }, [filters])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.company) params.append('company', filters.company)
      params.append('page', filters.page)
      params.append('limit', 20)

      const res = await axios.get(`/api/jobs?${params}`)
      setJobs(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条记录吗？')) return
    
    try {
      await axios.delete(`/api/jobs/${id}`)
      loadJobs()
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) return
    
    try {
      await axios.post('/api/jobs/batch-delete', { ids: selectedIds })
      setSelectedIds([])
      loadJobs()
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  const exportExcel = async () => {
    try {
      const res = await axios.get('/api/export/jobs')
      if (res.data.success) {
        window.open(res.data.data.download_url, '_blank')
      }
    } catch (err) {
      alert('导出失败: ' + err.message)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === jobs.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(jobs.map(j => j.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">投递记录</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出Excel
          </button>
          <Link
            to="/jobs/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新建投递
          </Link>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="搜索公司名称..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filters.company}
              onChange={(e) => setFilters(f => ({ ...f, company: e.target.value, page: 1 }))}
            />
          </div>

          {/* 状态筛选 */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="applied">已投递</option>
            <option value="interviewing">面试中</option>
            <option value="offered">已Offer</option>
            <option value="rejected">已拒绝</option>
          </select>

          {/* 批量操作 */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              删除选中 ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p>暂无投递记录</p>
            <Link to="/jobs/new" className="text-primary-600 text-sm hover:underline">
              创建第一条记录
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === jobs.length && jobs.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">公司名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">岗位</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">公司规模</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">是否上市</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">投递时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(job.id)}
                        onChange={() => toggleSelect(job.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{job.company_name}</div>
                      {job.source_platform && (
                        <div className="text-xs text-gray-400">{job.source_platform}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{job.position}</div>
                      {job.salary_range && (
                        <div className="text-xs text-green-600">{job.salary_range}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{job.company_scale || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{job.company_stock || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{job.apply_date}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/jobs/${job.id}/edit`}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              共 {pagination.total} 条记录
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="text-sm text-gray-600">
                第 {filters.page} / {pagination.pages} 页
              </span>
              <button
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    pending: { label: '待处理', className: 'status-pending' },
    applied: { label: '已投递', className: 'status-applied' },
    interviewing: { label: '面试中', className: 'status-interviewing' },
    offered: { label: '已Offer', className: 'status-offered' },
    rejected: { label: '已拒绝', className: 'status-rejected' },
    withdrawn: { label: '已撤回', className: 'status-withdrawn' },
  }
  const c = config[status] || config.pending
  return <span className={`px-2 py-1 rounded-full text-xs ${c.className}`}>{c.label}</span>
}