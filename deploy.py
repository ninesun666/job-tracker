# 面试投递记录平台 - 部署脚本 (Windows)
# 服务器: 150.109.254.228:7778

import paramiko
from pathlib import Path
import time

# 服务器配置
SERVER_IP = "150.109.254.228"
SERVER_PORT = 22
SERVER_USER = "ubuntu"
SERVER_PASSWORD = "19990402GJXmxy@@@"
REMOTE_DIR = "/home/ubuntu/job-tracker"
APP_PORT = 7778

LOCAL_DIR = Path(__file__).parent

def run_cmd(client, cmd, show=True):
    """执行远程命令"""
    if show:
        print(f"  $ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out, err

def main():
    print("=" * 60)
    print("  Job Tracker 部署脚本")
    print("=" * 60)
    print(f"  服务器: {SERVER_IP}")
    print(f"  应用端口: {APP_PORT}")
    print("=" * 60)
    
    # 连接服务器
    print("\n[1/6] 连接服务器...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, SERVER_PORT, SERVER_USER, SERVER_PASSWORD, timeout=10)
        print("  ✓ 连接成功")
    except Exception as e:
        print(f"  ✗ 连接失败: {e}")
        return
    
    sftp = client.open_sftp()
    
    # 创建目录
    print("\n[2/6] 创建目录...")
    dirs = [
        REMOTE_DIR,
        f"{REMOTE_DIR}/app/backend/routes",
        f"{REMOTE_DIR}/app/backend/models",
        f"{REMOTE_DIR}/app/backend/services",
        f"{REMOTE_DIR}/app/frontend/dist/assets",
        f"{REMOTE_DIR}/app/data",
        f"{REMOTE_DIR}/app/uploads",
    ]
    for d in dirs:
        run_cmd(client, f"mkdir -p {d}", show=False)
    print("  ✓ 目录创建完成")
    
    # 上传后端文件
    print("\n[3/6] 上传后端文件...")
    backend_dir = LOCAL_DIR / "backend"
    files = [
        "server.js", "package.json",
        "routes/jobs.js", "routes/company.js", "routes/ocr.js", "routes/export.js",
        "models/database.js", "services/glmVision.js"
    ]
    
    for f in files:
        local = backend_dir / f
        if local.exists():
            remote = f"{REMOTE_DIR}/app/backend/{f}"
            print(f"  ↑ {f}")
            sftp.put(str(local), remote)
    print("  ✓ 后端上传完成")
    
    # 上传前端
    print("\n[4/6] 上传前端文件...")
    dist_dir = LOCAL_DIR / "frontend" / "dist"
    
    if dist_dir.exists():
        index = dist_dir / "index.html"
        if index.exists():
            print(f"  ↑ index.html")
            sftp.put(str(index), f"{REMOTE_DIR}/app/frontend/dist/index.html")
        
        assets = dist_dir / "assets"
        if assets.exists():
            for a in assets.iterdir():
                if a.is_file():
                    print(f"  ↑ assets/{a.name}")
                    sftp.put(str(a), f"{REMOTE_DIR}/app/frontend/dist/assets/{a.name}")
    print("  ✓ 前端上传完成")
    
    # 创建 docker-compose
    print("\n[5/6] 创建配置...")
    
    compose = f'''services:
  job-tracker:
    image: node:20-alpine
    container_name: job-tracker
    working_dir: /app/backend
    ports:
      - "{APP_PORT}:3001"
    volumes:
      - ./app/backend:/app/backend
      - ./app/frontend/dist:/app/backend/public
      - ./app/data:/app/backend/data
      - ./app/uploads:/app/backend/uploads
    environment:
      - NODE_ENV=production
      - PORT=3001
      - OCR_PROVIDER=qwen
      - LLM_API_URL=https://coding.dashscope.aliyuncs.com/v1/chat/completions
      - LLM_API_KEY=sk-sp-7095e3bc7553405abf63e6e7f0d39450
      - LLM_MODEL=glm-5
    command: sh -c "npm install --production && node server.js"
    restart: unless-stopped
'''
    
    with sftp.file(f"{REMOTE_DIR}/docker-compose.yml", 'w') as f:
        f.write(compose)
    print("  ✓ 配置创建完成")
    
    # 启动服务
    print("\n[6/6] 启动服务...")
    
    # 检查 Docker
    out, _ = run_cmd(client, "docker --version 2>/dev/null || echo NEED_INSTALL")
    if "NEED_INSTALL" in out:
        print("  安装 Docker...")
        run_cmd(client, "curl -fsSL https://get.docker.com | sudo sh")
        run_cmd(client, "sudo usermod -aG docker $USER")
        print("  ✓ Docker 安装完成，需要重新登录")
    
    # 启动
    print("  启动容器...")
    run_cmd(client, f"cd {REMOTE_DIR} && docker-compose down 2>/dev/null || true")
    run_cmd(client, f"cd {REMOTE_DIR} && docker-compose up -d --build")
    
    time.sleep(3)
    
    # 状态
    print("\n  容器状态:")
    out, _ = run_cmd(client, f"cd {REMOTE_DIR} && docker-compose ps")
    for line in out.strip().split('\n'):
        print(f"    {line}")
    
    sftp.close()
    client.close()
    
    print("\n" + "=" * 60)
    print("  ✓ 部署完成！")
    print("=" * 60)
    print(f"\n  访问地址: http://{SERVER_IP}:{APP_PORT}")
    print("=" * 60)

if __name__ == "__main__":
    main()