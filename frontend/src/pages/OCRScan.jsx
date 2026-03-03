import { useState, useRef } from 'react'
import { 
  Upload, 
  Camera, 
  FileImage,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Plus
} from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function OCRScan() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // 预览图片
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)
    
    // 上传识别
    uploadAndRecognize(file)
  }

  const handlePaste = async (e) => {
    const items = e.clipboardData.items
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        setPreview(URL.createObjectURL(file))
        uploadAndRecognize(file)
        break
      }
    }
  }

  const uploadAndRecognize = async (file) => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await axios.post('/api/ocr/recognize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.success) {
        setResult(res.data.data)
      } else {
        setError('识别失败，请重试')
      }
    } catch (err) {
      setError(err.response?.data?.error || '识别失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
      uploadAndRecognize(file)
    }
  }

  const createJobFromResult = () => {
    if (!result?.extracted_info) return
    
    // 跳转到新建页面，带上识别的信息
    navigate('/jobs/new', { state: { prefilled: result.extracted_info } })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">AI 识图</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-600 mb-4">
          上传招聘截图，AI 将自动识别并提取岗位信息，帮助你快速创建投递记录。
        </p>

        {/* 上传区域 */}
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center
            transition-colors cursor-pointer
            ${loading ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
          `}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
              <p className="text-primary-600 font-medium">正在识别中...</p>
            </div>
          ) : preview ? (
            <div className="flex flex-col items-center gap-3">
              <img 
                src={preview} 
                alt="预览" 
                className="max-h-64 rounded-lg shadow-md"
              />
              <p className="text-gray-500">点击更换图片</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">点击或拖拽上传图片</p>
                <p className="text-gray-500 text-sm mt-1">支持 Ctrl+V 粘贴截图</p>
              </div>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* 识别结果 */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">识别成功</span>
            </div>

            {/* 提取的信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">提取的信息</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoItem label="公司名称" value={result.extracted_info?.company_name} />
                <InfoItem label="岗位名称" value={result.extracted_info?.position} />
                <InfoItem label="薪资范围" value={result.extracted_info?.salary_range} />
                <InfoItem label="工作地点" value={result.extracted_info?.location} />
              </div>
              
              {result.extracted_info?.position_requirements?.length > 0 && (
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">职位要求：</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {result.extracted_info.position_requirements.map((req, i) => (
                      <span key={i} className="px-2 py-1 bg-white rounded text-xs text-gray-600">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 原始文本 */}
            {result.recognized_text && (
              <details className="bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  查看原始识别文本
                </summary>
                <pre className="mt-2 p-3 bg-white rounded text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-48">
                  {result.recognized_text}
                </pre>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={createJobFromResult}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                创建投递记录
              </button>
              <button
                onClick={() => {
                  setPreview(null)
                  setResult(null)
                  setError('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                重新识别
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 使用提示 */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-2">💡 使用提示</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 支持识别 Boss直聘、拉勾、猎聘等主流招聘平台的截图</li>
          <li>• 截图越清晰，识别效果越好</li>
          <li>• 识别结果仅供参考，创建记录时可手动修改</li>
          <li>• 如需使用 AI 识别功能，请配置 ANTHROPIC_API_KEY</li>
        </ul>
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  if (!value) return null
  return (
    <div>
      <span className="text-gray-500">{label}：</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}