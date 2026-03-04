/**
 * 飞书风格图标组件
 * 图标名称参考: https://open.feishu.cn/document/feishu-cards/enumerations-for-icons
 */

import React from 'react'

// 图标尺寸预设
const sizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
}

// 图标基础样式
const baseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
}

/**
 * 创建图标组件
 */
function createIcon(path, viewBox = '0 0 24 24') {
  return ({ size = 'md', color = 'currentColor', style, ...props }) => {
    const iconSize = sizes[size] || size
    return (
      <svg
        viewBox={viewBox}
        width={iconSize}
        height={iconSize}
        style={{ ...baseStyle, color, ...style }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {path}
      </svg>
    )
  }
}

// ==================== 导航图标 ====================

// 首页/仪表盘
export const HomeIcon = createIcon(
  <>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </>
)

// 列表/记录
export const ListIcon = createIcon(
  <>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </>
)

// 添加/新建
export const PlusIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </>
)

// ==================== 统计图标 ====================

// 图表/统计
export const ChartIcon = createIcon(
  <>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </>
)

// 日历
export const CalendarIcon = createIcon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>
)

// 日历周
export const CalendarWeekIcon = createIcon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="14" x2="8" y2="14" />
    <line x1="12" y1="14" x2="12" y2="14" />
    <line x1="16" y1="14" x2="16" y2="14" />
  </>
)

// ==================== 业务图标 ====================

// 公司/建筑
export const BuildingIcon = createIcon(
  <>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
  </>
)

// 职位/公文包
export const BriefcaseIcon = createIcon(
  <>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </>
)

// 成功/勾选
export const CheckCircleIcon = createIcon(
  <>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </>
)

// 拒绝/X
export const XCircleIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </>
)

// 礼物/Offer
export const GiftIcon = createIcon(
  <>
    <polyline points="20,12 20,22 4,22 4,12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </>
)

// ==================== 操作图标 ====================

// 搜索
export const SearchIcon = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
)

// 筛选
export const FilterIcon = createIcon(
  <>
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
  </>
)

// 下载/导出
export const DownloadIcon = createIcon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
)

// 上传
export const UploadIcon = createIcon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </>
)

// 编辑
export const EditIcon = createIcon(
  <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>
)

// 删除
export const TrashIcon = createIcon(
  <>
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </>
)

// 保存
export const SaveIcon = createIcon(
  <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </>
)

// 相机/扫描
export const CameraIcon = createIcon(
  <>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </>
)

// 关闭
export const CloseIcon = createIcon(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
)

// 菜单 (汉堡菜单)
export const MenuIcon = createIcon(
  <>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </>
)

// ==================== 用户相关 ====================
// GitHub 图标
export const GithubIcon = createIcon(
  <>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </>,
  '0 0 24 24'
)



// 用户
export const UserIcon = createIcon(
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
)

// 用户组
export const UsersIcon = createIcon(
  <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
)

// ==================== 状态图标 ====================

// 信息/提示
export const InfoIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </>
)

// 时钟/待处理
export const ClockIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </>
)

// 邮件/已投递
export const MailIcon = createIcon(
  <>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </>
)

// 消息/面试
export const MessageCircleIcon = createIcon(
  <>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </>
)

// 撤回
export const UndoIcon = createIcon(
  <>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </>
)

// ==================== 文件图标 ====================

// 文档
export const FileTextIcon = createIcon(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </>
)

// 空状态
export const InboxIcon = createIcon(
  <>
    <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </>
)

// 图片
export const ImageIcon = createIcon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21,15 16,10 5,21" />
  </>
)

// 提示
export const AlertCircleIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </>
)

// ==================== 箭头图标 ====================

// 右箭头
export const ArrowRightIcon = createIcon(
  <>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12,5 19,12 12,19" />
  </>
)

// 左箭头
export const ArrowLeftIcon = createIcon(
  <>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12,19 5,12 12,5" />
  </>
)

// ==================== Logo ====================

// Logo 图标 - 求职追踪主题
export const LogoIcon = ({ size = 'lg', color = 'white', style, ...props }) => {
  const iconSize = sizes[size] || size
  return (
    <svg
      viewBox="0 0 32 32"
      width={iconSize}
      height={iconSize}
      style={{ ...baseStyle, color, ...style }}
      {...props}
    >
      {/* 圆角矩形背景 */}
      <rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
      
      {/* 渐变定义 */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3370ff" />
          <stop offset="100%" stopColor="#5583ff" />
        </linearGradient>
      </defs>
      
      {/* 简历/文档主体 */}
      <rect x="7" y="5" width="18" height="22" rx="2" fill="white" opacity="0.95" />
      
      {/* 文档折角 */}
      <path d="M19 5 L25 5 L25 11 Z" fill="white" opacity="0.7" />
      <path d="M19 5 L19 11 L25 11" fill="#3370ff" opacity="0.3" />
      
      {/* 人物头像圆圈 */}
      <circle cx="16" cy="11" r="2.5" fill="#3370ff" opacity="0.8" />
      
      {/* 文档内容线条 */}
      <rect x="10" y="15" width="12" height="1.5" rx="0.75" fill="#3370ff" opacity="0.4" />
      <rect x="10" y="18" width="8" height="1.5" rx="0.75" fill="#3370ff" opacity="0.3" />
      
      {/* 勾选标记 - 表示追踪/完成 */}
      <circle cx="24" cy="24" r="6" fill="#00b578" />
      <path 
        d="M21 24 L23.5 26.5 L27 22" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// 简化版 Logo - 用于侧边栏
export const JobTrackerLogo = ({ size = 'md', style, ...props }) => {
  const iconSize = sizes[size] || size
  return (
    <svg
      viewBox="0 0 24 24"
      width={iconSize}
      height={iconSize}
      style={{ ...baseStyle, ...style }}
      {...props}
    >
      {/* 简历文档 */}
      <rect x="3" y="2" width="14" height="18" rx="2" fill="currentColor" opacity="0.9" />
      
      {/* 折角 */}
      <path d="M13 2 L17 2 L17 6 Z" fill="white" opacity="0.5" />
      <path d="M13 2 L13 6 L17 6" fill="currentColor" opacity="0.3" />
      
      {/* 头像 */}
      <circle cx="10" cy="7" r="2" fill="white" opacity="0.9" />
      
      {/* 内容线 */}
      <rect x="6" y="10" width="8" height="1" rx="0.5" fill="white" opacity="0.5" />
      <rect x="6" y="12.5" width="5" height="1" rx="0.5" fill="white" opacity="0.4" />
      
      {/* 勾选徽章 */}
      <circle cx="17" cy="17" r="5" fill="#00b578" />
      <path 
        d="M14.5 17 L16.5 19 L19.5 15.5" 
        stroke="white" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// 导出所有图标
export default {
  GithubIcon,
  HomeIcon,
  ListIcon,
  PlusIcon,
  ChartIcon,
  CalendarIcon,
  CalendarWeekIcon,
  BuildingIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  GiftIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  UploadIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  CameraIcon,
  CloseIcon,
  MenuIcon,
  UserIcon,
  UsersIcon,
  ClockIcon,
  MailIcon,
  MessageCircleIcon,
  UndoIcon,
  FileTextIcon,
  InboxIcon,
  ImageIcon,
  AlertCircleIcon,
  InfoIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  LogoIcon
}
