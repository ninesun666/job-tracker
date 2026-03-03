# AGENTS.md - Job Tracker 项目指南

## 项目概述

**面试投递记录平台** - 一个帮助求职者管理投递记录、AI 识图提取岗位信息、自动调研公司的全栈 Web 应用。

### 核心功能
- 📋 **投递记录管理** - CRUD 操作，状态追踪
- 🤖 **AI 识图 OCR** - 从招聘截图自动提取岗位信息
- 🏢 **公司调研** - 自动查询公司背景、规模、上市状态
- 📊 **统计分析** - 投递趋势、转化率分析
- 📥 **Excel 导出** - 一键导出投递记录

### 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  React 18 + Vite + React Router + TailwindCSS           │
│  端口: 3000                                              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (Node.js)                      │
│  Express + JWT Auth + Multer (文件上传)                  │
│  端口: 3001                                              │
└─────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │PostgreSQL│      │ AI APIs  │      │ 文件存储  │
    │  数据库   │      │OCR/LLM  │      │ uploads/ │
    └──────────┘      └──────────┘      └──────────┘
```

---

## 目录结构

```
job-tracker/
├── backend/                    # 后端服务
│   ├── server.js              # 入口文件
│   ├── models/
│   │   └── database.js        # PostgreSQL 连接与初始化
│   ├── routes/
│   │   ├── auth.js            # GitHub OAuth 认证
│   │   ├── jobs.js            # 投递记录 CRUD
│   │   ├── ocr.js             # AI 图片识别
│   │   ├── company.js         # 公司信息查询
│   │   └── export.js          # Excel 导出
│   ├── services/
│   │   ├── glmVision.js       # GLM Vision OCR 服务
│   │   ├── companySearch.js   # 公司搜索服务
│   │   └── companyService.js  # 公司信息聚合
│   ├── uploads/               # 上传文件存储
│   └── tests/                 # 测试文件
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── App.jsx            # 主应用组件
│   │   ├── main.jsx           # 入口文件
│   │   ├── components/
│   │   │   ├── Icons.jsx      # SVG 图标组件
│   │   │   └── Layout.jsx     # 布局组件
│   │   └── pages/
│   │       ├── Dashboard.jsx  # 仪表盘
│   │       ├── Applications.jsx # 投递列表
│   │       ├── JobForm.jsx    # 表单组件
│   │       ├── NewApplication.jsx # 新建/编辑页面
│   │       ├── OCRScan.jsx    # OCR 识图页面
│   │       └── Stats.jsx      # 统计分析
│   ├── vite.config.js         # Vite 配置
│   └── dist/                  # 构建输出
│
├── Dockerfile                  # Docker 构建文件
├── docker-compose.yml         # 本地开发 Docker 配置
├── docker-compose.prod.yml    # 生产环境 Docker 配置
├── .github/workflows/
│   └── deploy.yml             # CI/CD 自动部署
└── deploy-server.sh           # 服务器部署脚本
```

---

## 开发指南

### 环境准备

1. **安装依赖**
   ```bash
   # 后端
   cd backend && npm install
   
   # 前端
   cd frontend && npm install
   ```

2. **配置环境变量**
   ```bash
   cp backend/.env.example backend/.env
   # 编辑 .env 填入实际配置
   ```

### 本地开发

**方式一：分别启动**
```bash
# 终端 1 - 后端
cd backend && npm run dev      # http://localhost:3001

# 终端 2 - 前端
cd frontend && npm run dev     # http://localhost:3000
```

**方式二：Docker 开发环境**
```bash
docker-compose up -d
# 访问 http://localhost:3001
```

### 构建与部署

**前端构建**
```bash
cd frontend && npm run build
# 输出到 frontend/dist/
```

**Docker 构建**
```bash
docker build -t job-tracker .
docker run -p 3001:3001 job-tracker
```

**生产部署**
- 推送到 `main` 分支自动触发 GitHub Actions
- 构建 Docker 镜像推送到 Docker Hub
- SSH 部署到服务器

---

## 环境变量配置

### 必需配置

| 变量 | 说明 |
|------|------|
| `PG_HOST` | PostgreSQL 主机 |
| `PG_DATABASE` | 数据库名 |
| `PG_USER` | 数据库用户 |
| `PG_PASSWORD` | 数据库密码 |
| `JWT_SECRET` | JWT 签名密钥 |

### GitHub OAuth

| 变量 | 说明 |
|------|------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret |
| `GITHUB_CALLBACK_URL` | 回调地址 |

### AI 服务 (至少配置一个)

| 变量 | 说明 |
|------|------|
| `OCR_PROVIDER` | OCR 提供商: `qwen` / `glm` / `claude` / `openai` |
| `LLM_API_KEY` | 通义千问/OpenAI API Key |
| `LLM_API_URL` | API 端点 |
| `LLM_MODEL` | 模型名称 (如 `qwen-vl-plus`) |
| `GLM_API_KEY` | 智谱 GLM API Key |
| `ANTHROPIC_API_KEY` | Claude API Key |

---

## API 端点

### 认证
- `GET /api/auth/github` - GitHub OAuth 登录
- `GET /api/auth/github/callback` - OAuth 回调
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/logout` - 登出

### 投递记录 (需认证)
- `GET /api/jobs` - 列表 (支持分页、筛选)
- `GET /api/jobs/:id` - 详情
- `POST /api/jobs` - 创建
- `PUT /api/jobs/:id` - 更新
- `DELETE /api/jobs/:id` - 删除
- `GET /api/jobs/stats/overview` - 统计概览

### OCR 服务
- `POST /api/ocr/recognize` - 上传图片识别
- `GET /api/ocr/status` - 服务状态
- `GET /api/ocr/test` - 测试连接

### 导出
- `GET /api/export/excel` - 导出 Excel

### 健康检查
- `GET /api/health` - 服务健康状态

---

## 数据模型

### job_applications (投递记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| user_id | INTEGER | 用户 ID |
| company_name | VARCHAR(255) | 公司名称 (必填) |
| company_scale | VARCHAR(50) | 公司规模 |
| company_stock | VARCHAR(50) | 上市状态 |
| position | VARCHAR(255) | 职位名称 (必填) |
| salary_range | VARCHAR(50) | 薪资范围 |
| location | VARCHAR(255) | 工作地点 |
| status | VARCHAR(50) | 状态 |
| apply_date | DATE | 投递日期 |
| resume_sent | BOOLEAN | 是否投递简历 |
| hr_name | VARCHAR(100) | HR 姓名 |
| hr_contact | VARCHAR(255) | HR 联系方式 |
| source_platform | VARCHAR(50) | 来源平台 |
| notes | TEXT | 备注 |

---

## 编码规范

### 后端 (Node.js)
- 使用 CommonJS (`require` / `module.exports`)
- 异步操作使用 `async/await`
- 路由参数使用 PostgreSQL 占位符 `$1, $2...`
- 错误统一返回 `{ success: false, error: '错误信息' }`

### 前端 (React)
- 函数式组件 + Hooks
- 样式使用 TailwindCSS 工具类
- 路由使用 `react-router-dom` v6
- API 请求使用 `axios`

### 数据库
- PostgreSQL
- 参数化查询防止 SQL 注入
- 使用 `created_at` / `updated_at` 时间戳

---

## 常用命令速查

```bash
# 开发
npm run dev              # 启动开发服务器 (nodemon)
npm start                # 生产启动

# 构建
npm run build            # 前端构建

# Docker
docker-compose up -d     # 启动开发容器
docker-compose down      # 停止容器
docker logs job-tracker  # 查看日志

# 数据库
# 表会在首次启动时自动创建

# 测试
cd backend && npm test   # 运行后端测试
```

---

## 注意事项

1. **用户隔离**: 所有投递记录按 `user_id` 隔离，需 JWT 认证
2. **文件上传**: 图片存储在 `backend/uploads/`，最大 10MB
3. **OCR 服务**: 需配置至少一个 AI 服务才能使用识图功能
4. **跨域**: 开发环境已配置 CORS，生产环境前后端同源
5. **Windows 环境**: 使用 PowerShell 语法，避免 `&&` 链式命令

---

## 部署架构

```
GitHub Push → GitHub Actions → Docker Build → Docker Hub
                                              ↓
                                    Server Pull & Deploy
                                              ↓
                                    Nginx → Container:3001
```

服务器路径: `/opt/job-tracker/`
