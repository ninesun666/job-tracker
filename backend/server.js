/**
 * 面试投递记录平台 - 后端服务
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// 配置中间件
function configureApp() {
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 静态文件（上传的图片）
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // API 路由
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/login', require('./routes/auth')); // GitHub OAuth 回调兼容路径
  app.use('/api/jobs', require('./routes/jobs'));
  app.use('/api/company', require('./routes/company'));
  app.use('/api/ocr', require('./routes/ocr'));
  app.use('/api/export', require('./routes/export'));

  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: isProduction ? 'production' : 'development'
    });
  });

  // 生产环境：服务前端静态文件
  if (isProduction) {
    const publicDir = path.join(__dirname, 'public');
    if (fs.existsSync(publicDir)) {
      // 静态资源
      app.use(express.static(publicDir));
      
      // SPA 路由支持
      app.get('*', (req, res) => {
        res.sendFile(path.join(publicDir, 'index.html'));
      });
    }
  }

  // 错误处理
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || '服务器错误' });
  });
}

// 初始化数据库并启动服务
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    
    // 配置应用
    configureApp();

    app.listen(PORT, () => {
      console.log(`🚀 Job Tracker API running on http://localhost:${PORT}`);
      if (isProduction) {
        console.log(`📦 Production mode - serving static files`);
      } else {
        console.log(`🔧 Development mode`);
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// 测试环境：只配置 app，不启动服务器
if (isTest) {
  configureApp();
  module.exports = { app, configureApp };
} else {
  // 正常启动
  startServer();
  module.exports = { app, configureApp };
}
