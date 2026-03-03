import { useEffect, useState } from 'react'
import { 
  BarChart3, 
  TrendingUp,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import axios from 'axios'

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await axios.get('/api/jobs/stats/overview')
      setStats(res.data.data)
      
      // 生成模拟图表数据（实际项目中应该从后端获取）
      const mockChartData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        mockChartData.push({
          date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          count: Math.floor(Math.random() * 5) + 1
        })
      }
      setChartData(mockChartData)
    } catch (err) {
      console.error('加载统计失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">统计分析</h1>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase}
          label="总投递数"
          value={stats?.total || 0}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={CheckCircle}
          label="面试数"
          value={stats?.interviewing || 0}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          icon={XCircle}
          label="已拒绝"
          value={stats?.rejected || 0}
          color="text-red-600"
          bgColor="bg-red-100"
        />
        <StatCard
          icon={TrendingUp}
          label="本周投递"
          value={stats?.thisWeek || 0}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* 投递趋势 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">近7天投递趋势</h2>
        <div className="h-48">
          <SimpleBarChart data={chartData} />
        </div>
      </div>

      {/* 状态分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">状态分布</h2>
          <div className="space-y-3">
            <StatusProgress 
              label="待处理" 
              value={stats?.pending || 0} 
              total={stats?.total || 1}
              color="bg-gray-400"
            />
            <StatusProgress 
              label="已投递" 
              value={stats?.applied || 0} 
              total={stats?.total || 1}
              color="bg-blue-500"
            />
            <StatusProgress 
              label="面试中" 
              value={stats?.interviewing || 0} 
              total={stats?.total || 1}
              color="bg-yellow-500"
            />
            <StatusProgress 
              label="已Offer" 
              value={stats?.offered || 0} 
              total={stats?.total || 1}
              color="bg-green-500"
            />
            <StatusProgress 
              label="已拒绝" 
              value={stats?.rejected || 0} 
              total={stats?.total || 1}
              color="bg-red-500"
            />
          </div>
        </div>

        {/* 转化率 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">转化漏斗</h2>
          <div className="space-y-4">
            <FunnelStep 
              label="投递简历" 
              value={stats?.total || 0} 
              width="100%"
            />
            <FunnelStep 
              label="获得面试" 
              value={stats?.interviewing || 0} 
              width={`${((stats?.interviewing || 0) / (stats?.total || 1) * 100)}%`}
            />
            <FunnelStep 
              label="收到Offer" 
              value={stats?.offered || 0} 
              width={`${((stats?.offered || 0) / (stats?.total || 1) * 100)}%`}
            />
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {((stats?.interviewing || 0) / (stats?.total || 1) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">面试率</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {((stats?.offered || 0) / (stats?.total || 1) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Offer率</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 统计摘要 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold opacity-90">本月投递</h2>
            <p className="text-4xl font-bold mt-2">{stats?.thisMonth || 0}</p>
            <p className="text-sm opacity-80 mt-1">
              平均每天 {((stats?.thisMonth || 0) / 30).toFixed(1)} 次
            </p>
          </div>
          <Calendar className="w-20 h-20 opacity-20" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`${bgColor} p-2 rounded-lg`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  )
}

function StatusProgress({ label, value, total, color }) {
  const percentage = (value / total) * 100
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-800 font-medium">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function FunnelStep({ label, value, width }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-sm text-gray-600">{label}</div>
      <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden">
        <div 
          className="h-full bg-primary-500 flex items-center justify-end pr-2 text-white text-sm font-medium"
          style={{ width: width === '100%' ? '100%' : `calc(${width} + 20%)`, minWidth: '20%' }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

function SimpleBarChart({ data }) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  
  return (
    <div className="h-full flex items-end justify-around gap-2">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-primary-500 rounded-t transition-all duration-300"
            style={{ height: `${(item.count / maxCount) * 100}%` }}
          />
          <div className="text-xs text-gray-500 mt-2">{item.date}</div>
          <div className="text-xs text-gray-400">{item.count}</div>
        </div>
      ))}
    </div>
  )
}