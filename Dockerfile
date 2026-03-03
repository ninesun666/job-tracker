# Job Tracker - 面试投递记录平台
# 多阶段构建

# ==================== 前端构建 ====================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制前端源码
COPY frontend/ ./

# 构建生产版本
RUN npm run build

# ==================== 后端构建 ====================
FROM node:20-alpine

WORKDIR /app

# 安装后端依赖
COPY backend/package*.json ./
RUN npm install --production

# 复制后端源码
COPY backend/ ./

# 从前端构建阶段复制静态文件
COPY --from=frontend-builder /app/frontend/dist ./public

# 创建数据目录
RUN mkdir -p /app/data /app/uploads

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 启动服务
CMD ["node", "server.js"]
