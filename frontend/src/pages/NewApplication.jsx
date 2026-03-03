import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { 
  BuildingIcon, 
  BriefcaseIcon, 
  CalendarIcon,
  SearchIcon,
  CameraIcon,
  UploadIcon,
  SaveIcon,
  CloseIcon,
  AlertCircleIcon,
  InfoIcon
} from '../components/Icons'

const API_BASE = '/api'

function NewApplication() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    company_name: '',
    company_scale: '',
    company_stock: '',
    company_founded: '',
    company_notes: '',
    position: '',
    position_description: '',
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

  const [loading, setLoading] = useState(false)
  const [showOcrModal, setShowOcrModal] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrPreview, setOcrPreview] = useState(null)
  const [companyLoading, setCompanyLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      fetchApplication()
    }
  }, [id])

  const fetchApplication = async () => {
    try {
      const res = await axios.get(`${API_BASE}/jobs/${id}`)
      if (res.data.success) {
        setFormData({
          ...res.data.data,
          resume_sent: !!res.data.data.resume_sent
        })
      }
    } catch (err) {
      alert('加载失败：' + err.message)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.company_name || !formData.position) {
      alert('请填写公司名称和岗位名称')
      return
    }

    setLoading(true)
    try {
      if (isEdit) {
        await axios.put(`${API_BASE}/jobs/${id}`, formData)
        alert('更新成功')
      } else {
        await axios.post(`${API_BASE}/jobs`, formData)
        alert('创建成功')
      }
      navigate('/applications')
    } catch (err) {
      alert('保存失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 公司调研
  const searchCompany = async () => {
    if (!formData.company_name) {
      alert('请先填写公司名称')
      return
    }

    setCompanyLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/company/search?name=${encodeURIComponent(formData.company_name)}`)
      if (res.data.success && res.data.data) {
        const info = res.data.data
        setFormData(prev => ({
          ...prev,
          company_scale: info.scale || prev.company_scale,
          company_stock: info.stock || prev.company_stock,
          company_founded: info.founded || prev.company_founded
        }))
        if (res.data.source === 'cache') {
          alert('从缓存加载公司信息')
        } else {
          alert('已获取公司信息')
        }
      }
    } catch (err) {
      alert('查询失败：' + err.message)
    } finally {
      setCompanyLoading(false)
    }
  }

  // 图片上传处理
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 预览图片
    const reader = new FileReader()
    reader.onload = (ev) => {
      setOcrPreview(ev.target.result)
    }
    reader.readAsDataURL(file)

    // 上传识别
    setOcrLoading(true)
    const formDataUpload = new FormData()
    formDataUpload.append('image', file)

    try {
      const res = await axios.post(`${API_BASE}/ocr/recognize`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.success && res.data.data) {
        const info = res.data.data
        setFormData(prev => ({
          ...prev,
          company_name: info.company_name || prev.company_name,
          company_notes: info.company_notes || prev.company_notes,
          position: info.position || prev.position,
          position_description: info.position_description || prev.position_description,
          position_requirements: Array.isArray(info.position_requirements) 
            ? info.position_requirements.join('\n') 
            : (info.position_requirements || prev.position_requirements),
          salary_range: info.salary_range || prev.salary_range,
          location: info.location || prev.location,
          company_scale: info.company_scale || prev.company_scale,
          source_platform: info.source_platform || prev.source_platform,
          hr_name: info.hr_name || prev.hr_name
        }))
        
        const benefits = Array.isArray(info.benefits) ? info.benefits.join('、') : ''
        if (benefits && !formData.notes) {
          setFormData(prev => ({
            ...prev,
            notes: `福利：${benefits}`
          }))
        }
        
        alert('识别成功，请检查并补充信息')
        setShowOcrModal(false)
      } else if (res.data.error) {
        alert('识别失败：' + res.data.error)
      }
    } catch (err) {
      alert('识别失败：' + err.message)
    } finally {
      setOcrLoading(false)
    }
  }

  const scaleOptions = ['0-50人', '50-150人', '150-500人', '500-1000人', '1000-5000人', '5000人以上']
  const stockOptions = ['未上市', '已上市', '新三板', '港股', '美股']
  const platformOptions = ['BOSS直聘', '智联招聘', '前程无忧', '拉勾', '猎聘', '脉脉', '其他']
  const statusOptions = [
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
          <h2 className="page-title">{isEdit ? '编辑记录' : '新建记录'}</h2>
          <p className="page-subtitle">填写投递信息</p>
        </div>
        <button 
          onClick={() => setShowOcrModal(true)} 
          className="btn btn-secondary"
        >
          <CameraIcon size="sm" />
          图片识别
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 公司信息 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BuildingIcon size="sm" className="card-title-icon" />
              公司信息
            </h3>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">公司名称</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  name="company_name"
                  className="form-input"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="输入公司名称"
                  required
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={searchCompany}
                  className="btn btn-secondary"
                  disabled={companyLoading}
                >
                  <SearchIcon size="sm" />
                  {companyLoading ? '查询中...' : '查询'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">公司规模</label>
              <select
                name="company_scale"
                className="form-select"
                value={formData.company_scale}
                onChange={handleChange}
              >
                <option value="">请选择</option>
                {scaleOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">是否上市</label>
              <select
                name="company_stock"
                className="form-select"
                value={formData.company_stock}
                onChange={handleChange}
              >
                <option value="">请选择</option>
                {stockOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">成立时间</label>
              <input
                type="text"
                name="company_founded"
                className="form-input"
                value={formData.company_founded}
                onChange={handleChange}
                placeholder="如：2015年"
              />
            </div>
          </div>
          
          {/* 公司注释 */}
          <div className="form-group">
            <label className="form-label">
              <InfoIcon size="sm" style={{ marginRight: 4, verticalAlign: 'middle' }} />
              公司注释
            </label>
            <textarea
              name="company_notes"
              className="form-textarea"
              value={formData.company_notes}
              onChange={handleChange}
              placeholder="公司背景信息，如是否为大厂子公司、外包公司、行业地位等..."
              rows={3}
              style={{ backgroundColor: formData.company_notes ? '#fefce8' : undefined }}
            />
            {formData.company_notes && (
              <div style={{ fontSize: '12px', color: 'var(--text-placeholder)', marginTop: 4 }}>
                💡 AI 自动生成，请核实准确性
              </div>
            )}
          </div>
        </div>

        {/* 岗位信息 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BriefcaseIcon size="sm" className="card-title-icon" />
              岗位信息
            </h3>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">岗位名称</label>
              <input
                type="text"
                name="position"
                className="form-input"
                value={formData.position}
                onChange={handleChange}
                placeholder="如：前端开发工程师"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">薪资范围</label>
              <input
                type="text"
                name="salary_range"
                className="form-input"
                value={formData.salary_range}
                onChange={handleChange}
                placeholder="如：20-30K"
              />
            </div>
            <div className="form-group">
              <label className="form-label">工作地点</label>
              <input
                type="text"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                placeholder="如：北京-朝阳区"
              />
            </div>
            <div className="form-group">
              <label className="form-label">来源平台</label>
              <select
                name="source_platform"
                className="form-select"
                value={formData.source_platform}
                onChange={handleChange}
              >
                <option value="">请选择</option>
                {platformOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">职位描述</label>
            <textarea
              name="position_description"
              className="form-textarea"
              value={formData.position_description}
              onChange={handleChange}
              placeholder="岗位职责描述，这个岗位是做什么的..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">职位要求</label>
            <textarea
              name="position_requirements"
              className="form-textarea"
              value={formData.position_requirements}
              onChange={handleChange}
              placeholder="职位技能和经验要求，每行一条..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">自我对标</label>
            <textarea
              name="self_match"
              className="form-textarea"
              value={formData.self_match}
              onChange={handleChange}
              placeholder="分析自己与岗位要求的匹配程度..."
            />
          </div>
        </div>

        {/* 投递状态 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CalendarIcon size="sm" className="card-title-icon" />
              投递状态
            </h3>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">投递时间</label>
              <input
                type="date"
                name="apply_date"
                className="form-input"
                value={formData.apply_date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">状态</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">HR姓名</label>
              <input
                type="text"
                name="hr_name"
                className="form-input"
                value={formData.hr_name}
                onChange={handleChange}
                placeholder="HR姓名"
              />
            </div>
            <div className="form-group">
              <label className="form-label">HR联系方式</label>
              <input
                type="text"
                name="hr_contact"
                className="form-input"
                value={formData.hr_contact}
                onChange={handleChange}
                placeholder="微信/电话"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                name="resume_sent"
                checked={formData.resume_sent}
                onChange={handleChange}
              />
              <span>已投递简历</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">备注</label>
            <textarea
              name="notes"
              className="form-textarea"
              value={formData.notes}
              onChange={handleChange}
              placeholder="其他备注信息..."
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="card" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <SaveIcon size="sm" />
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>

      {/* 图片识别模态框 */}
      {showOcrModal && (
        <div className="modal-overlay" onClick={() => setShowOcrModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <CameraIcon size="sm" style={{ marginRight: 8 }} />
                图片识别
              </h3>
              <button className="modal-close" onClick={() => setShowOcrModal(false)}>
                <CloseIcon size="sm" />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="upload-area" onClick={() => document.getElementById('imageInput').click()}>
                {ocrPreview ? (
                  <img src={ocrPreview} alt="预览" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} />
                ) : (
                  <>
                    <UploadIcon size="xl" style={{ color: 'var(--text-placeholder)', marginBottom: 12 }} />
                    <div className="upload-text">点击上传招聘截图</div>
                    <div className="upload-hint">支持 JPG、PNG 格式，最大 10MB</div>
                  </>
                )}
              </div>
              
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              
              {ocrLoading && (
                <div style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-secondary)' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto 8px' }}></div>
                  正在识别并查询公司背景...
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircleIcon size="sm" />
              上传招聘截图后，系统将自动提取信息并查询公司背景
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewApplication
