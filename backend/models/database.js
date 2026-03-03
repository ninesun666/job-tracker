/**
 * PostgreSQL 数据库连接
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'jobtracker',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 初始化数据库表（带重试）
async function initDatabase() {
  const maxRetries = 10;
  const retryDelay = 3000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let client;
    try {
      client = await pool.connect();
      console.log(`✅ PostgreSQL connected (attempt ${attempt}/${maxRetries})`);
      
      // 用户表
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          github_id INTEGER UNIQUE,
          github_username VARCHAR(100),
          name VARCHAR(100),
          email VARCHAR(255) UNIQUE NOT NULL,
          avatar TEXT,
          provider VARCHAR(50) DEFAULT 'github',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP
        )
      `);

      // 投递记录表
      await client.query(`
        CREATE TABLE IF NOT EXISTS job_applications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          company_name VARCHAR(255) NOT NULL,
          company_scale VARCHAR(50),
          company_stock VARCHAR(50),
          company_founded VARCHAR(50),
          company_notes TEXT,
          position VARCHAR(255) NOT NULL,
          position_description TEXT,
          position_requirements TEXT,
          self_match TEXT,
          notes TEXT,
          resume_sent BOOLEAN DEFAULT FALSE,
          apply_date DATE,
          status VARCHAR(50) DEFAULT 'pending',
          source_platform VARCHAR(50),
          salary_range VARCHAR(50),
          location VARCHAR(255),
          hr_name VARCHAR(100),
          hr_contact VARCHAR(255),
          interview_date DATE,
          interview_result TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 公司缓存表
      await client.query(`
        CREATE TABLE IF NOT EXISTS company_cache (
          id SERIAL PRIMARY KEY,
          company_name VARCHAR(255) UNIQUE NOT NULL,
          company_scale VARCHAR(50),
          company_stock VARCHAR(50),
          company_founded VARCHAR(50),
          company_industry VARCHAR(100),
          company_address TEXT,
          company_description TEXT,
          company_notes TEXT,
          source VARCHAR(50),
          raw_data TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // OCR 历史表
      await client.query(`
        CREATE TABLE IF NOT EXISTS ocr_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          image_path TEXT,
          recognized_text TEXT,
          extracted_info TEXT,
          application_id INTEGER REFERENCES job_applications(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 登录历史表
      await client.query(`
        CREATE TABLE IF NOT EXISTS login_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          email VARCHAR(255),
          provider VARCHAR(50),
          github_username VARCHAR(100),
          ip VARCHAR(50),
          user_agent TEXT,
          status VARCHAR(20) DEFAULT 'success',
          failure_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建索引
      await client.query(`CREATE INDEX IF NOT EXISTS idx_applications_user_id ON job_applications(user_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_applications_date ON job_applications(apply_date)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id)`);

      console.log('✅ PostgreSQL database initialized');
      return;
    } catch (err) {
      console.error(`❌ Database init attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw err;
      }
    } finally {
      if (client) client.release();
    }
  }
}

// 辅助函数：执行查询
async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

// 辅助函数：获取单行
async function get(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

// 辅助函数：获取多行
async function all(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

// 辅助函数：执行并返回 lastInsertRowid
async function run(sql, params = []) {
  const result = await pool.query(sql + ' RETURNING id', params);
  return { lastInsertRowid: result.rows[0]?.id || 0 };
}

module.exports = {
  pool,
  initDatabase,
  query,
  get,
  all,
  run
};