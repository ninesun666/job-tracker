# 面试投递记录平台

一个帮助求职者管理投递记录、AI识图提取岗位信息、自动调研公司的工具平台。

## 功能特性

- ✅ **投递记录管理** - 记录公司、岗位、投递状态等信息
- ✅ **AI 识图** - 从招聘截图自动提取岗位信息
- ✅ **公司调研** - 自动查询公司规模、上市状态
- ✅ **Excel 导出** - 一键导出投递记录
- ✅ **统计分析** - 投递趋势、转化率分析

## 快速开始

### 后端启动

```bash
cd backend
npm install
npm run dev
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

### 访问地址

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001

## 环境配置

复制 `backend/.env.example` 为 `backend/.env`，配置以下可选参数：

| 参数 | 说明 |
|------|------|
| ANTHROPIC_API_KEY | Claude API Key（用于AI识图） |
| DASHSCOPE_API_KEY | 通义千问 API Key |
| QCC_API_KEY | 企查查 API Key |
| TIANYANCHA_API_KEY | 天眼查 API Key |

## 数据字段

| 字段 | 说明 |
|------|------|
| 公司名称 | 必填 |
| 公司规模 | 0-20人/20-99人/100-499人等 |
| 是否上市 | 未上市/已上市/未知 |
| 成立时间 | 公司成立年份 |
| 岗位名称 | 必填 |
| 职位要求 | JD 要求 |
| 自我对标 | 个人与岗位匹配分析 |
| 备注 | 其他备注信息 |
| 是否投递简历 | 是/否 |
| 投递时间 | 投递日期 |
| 状态 | 待处理/已投递/面试中/已Offer/已拒绝 |
| 薪资范围 | 如 25-40K |
| 工作地点 | 城市/区域 |
| HR 姓名 | 招聘负责人 |
| HR 联系方式 | 电话/微信等 |
| 来源平台 | Boss直聘/拉勾/猎聘等 |

## 技术栈

- **前端**: React + Vite + TailwindCSS
- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **AI**: Claude Vision / 通义千问 VL
- **导出**: xlsx

## License

MIT