import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Save, 
  ArrowLeft, 
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  Search,
  Loader2
} from 'lucide-react'
import axios from 'axios'

const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'applied', label: '已投递' },
  { value: 'interviewing', label: '面试中' },
  { value: 'offered', label: '已Offer' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'withdrawn', label: '已撤回' },
]

const SCALE_OPTIONS = [
  '0-20人',
  '20-99人',
  '100-499人',
  '500-999人',
  '1000-9999人',
  '10000人以上',
  '未知'
]

const STOCK_OPTIONS = ['未上市', '已上市', '未知']

export default function JobForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    company_scale: '',
    company_stock: '',
    company_founded: '',
    position: '',
    position_requirements: '',
    self_match: '',
    notes: '',
    resume_sent: false,
    apply_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    source_platform: '',
    salary_range: '',
    location: '',
    hr_name: '',
    hr_contact: ''
  })

  useEffect(() => {
    if (isEdit) {
      loadJob()
    }
  }, [id])

  const loadJob = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/jobs/${id}`)
      setFormData({
        ...res.data.data,
        resume_sent: Boolean(res.data.data.resume_sent)
      })
    } catch (err) {
      alert('加载失败: ' + err.message)
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const searchCompany = async () => {
    if (!formData.company_name) return
    
    try {
      setSearching(true)
      const res = await axios.get(`/api/company/search/${encodeURIComponent(formData.company_name)}`)
      if (res.data.success && res.data.data) {
        const info = res.data.data
        setFormData(prev => ({
          ...prev,
          company_scale: info.company_scale || prev.company_scale,
          company_stock: info.company_stock || prev.company_stock,
          company_founded: info.company_founded || prev.company_founded
        }))
      }
    } catch (err) {
      console.error('查询公司失败:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.company_name || !formData.position) {
      alert('请填写公司名称和岗位名称')
      return
    }

    try {
      setLoading(true)
      if (isEdit) {
        await axios.put(`/api/jobs/${id}`, formData)
        alert('更新成功')
      } else {
        await axios.post('/api/jobs', formData)
        alert('创建成功')
      }
      navigate('/jobs')
    } catch (err) {
      alert('保存失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? '编辑投递记录' : '新建投递记录'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 公司信息 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            公司信息
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 公司名称 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                公司名称 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="输入公司名称"
                  required
                />
                <button
                  type="button"
                  onClick={searchCompany}
                  disabled={searching || !formData.company_name}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  查询
                </button>
              </div>
            </div>

            {/* 公司规模 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司规模</label>
              <select
                name="company_scale"
                value={formData.company_scale}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">请选择</option>
                {SCALE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* 是否上市 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">是否上市</label>
              <select
                name="company_stock"
                value={formData.company_stock}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">请选择</option>
                {STOCK_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* 成立时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成立时间</label>
              <input
                type="text"
                name="company_founded"
                value={formData.company_founded}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="如：2015年"
              />
            </div>

            {/* 来源平台 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">来源平台</label>
              <input
                type="text"
                name="source_platform"
                value={formData.source_platform}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="如：Boss直聘、拉勾"
              />
            </div>
          </div>
        </div>

        {/* 岗位信息 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary-600" />
            岗位信息
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 岗位名称 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                岗位名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="如：高级前端工程师"
                required
              />
            </div>

            {/* 薪资范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">薪资范围</label>
              <input
                type="text"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="如：25-40K"
              />
            </div>

            {/* 工作地点 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作地点</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="如：北京·朝阳区"
              />
            </div>

            {/* 职位要求 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">职位要求</label>
              <textarea
                name="position_requirements"
                value={formData.position_requirements}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="列出职位要求..."
              />
            </div>

            {/* 自我对标 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">自我对标</label>
              <textarea
                name="self_match"
                value={formData.self_match}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="分析自己与岗位的匹配度..."
              />
            </div>
          </div>
        </div>

        {/* 投递状态 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            投递状态
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 投递时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">投递时间</label>
              <input
                type="date"
                name="apply_date"
                value={formData.apply_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* 是否投递简历 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="resume_sent"
                id="resume_sent"
                checked={formData.resume_sent}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="resume_sent" className="text-sm text-gray-700">
                已投递简历
              </label>
            </div>

            {/* HR信息 */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HR姓名</label>
                <input
                  type="text"
                  name="hr_name"
                  value={formData.hr_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HR联系方式</label>
                <input
                  type="text"
                  name="hr_contact"
                  value={formData.hr_contact}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* 备注 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="其他备注信息..."
              />
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            保存
          </button>
        </div>
      </form>
    </div>
  )
}