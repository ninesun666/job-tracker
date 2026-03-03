#!/bin/bash

# Job Tracker 部署脚本
# 服务器: 150.109.254.228
# 端口: 7778

set -e

echo "=========================================="
echo "  Job Tracker 部署脚本"
echo "=========================================="

# 配置
SERVER_IP="150.109.254.228"
SERVER_PORT="7778"
SERVER_USER="root"
PROJECT_DIR="/opt/job-tracker"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "[安装] Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "[安装] Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建项目目录
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  job-tracker:
    image: node:20-alpine
    container_name: job-tracker
    working_dir: /app
    ports:
      - "7778:3001"
    volumes:
      - ./app:/app
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - PORT=3001
      - OCR_PROVIDER=qwen
      - LLM_API_URL=${LLM_API_URL}
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_MODEL=${LLM_MODEL:-glm-5}
    command: sh -c "npm install --production && node server.js"
    restart: unless-stopped
EOF

# 创建 .env 文件（如果不存在）
if [ ! -f .env ]; then
    cat > .env << 'EOF'
LLM_API_URL=https://coding.dashscope.aliyuncs.com/v1/chat/completions
LLM_API_KEY=sk-sp-7095e3bc7553405abf63e6e7f0d39450
LLM_MODEL=glm-5
EOF
    echo "[配置] 已创建 .env 文件"
fi

# 创建目录
mkdir -p app/data app/uploads app/public

echo "[部署] 复制应用文件..."
# 文件复制由外部脚本完成

echo "[启动] 启动服务..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "  访问地址: http://${SERVER_IP}:${SERVER_PORT}"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo ""
echo "=========================================="
