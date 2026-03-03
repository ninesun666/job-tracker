/**
 * 数据库模型 - sql.js (纯 JS 实现，无需编译)
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/jobtracker.db');
const DATA_DIR = path.dirname(DB_PATH);

let db = null;

// 初始化数据库
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // 确保数据目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // 尝试加载现有数据库
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // 创建表结构
  db.run(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      company_scale TEXT,
      company_stock TEXT,
      company_founded TEXT,
      company_notes TEXT,
      position TEXT NOT NULL,
      position_description TEXT,
      position_requirements TEXT,
      self_match TEXT,
      notes TEXT,
      resume_sent INTEGER DEFAULT 0,
      apply_date TEXT,
      status TEXT DEFAULT 'pending',
      source_platform TEXT,
      salary_range TEXT,
      location TEXT,
      hr_name TEXT,
      hr_contact TEXT,
      interview_date TEXT,
      interview_result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 添加新列（如果不存在）
  try {
    db.run(`ALTER TABLE job_applications ADD COLUMN company_notes TEXT`);
  } catch (e) {}
  try {
    db.run(`ALTER TABLE job_applications ADD COLUMN position_description TEXT`);
  } catch (e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS company_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT UNIQUE NOT NULL,
      company_scale TEXT,
      company_stock TEXT,
      company_founded TEXT,
      company_industry TEXT,
      company_address TEXT,
      company_description TEXT,
      company_notes TEXT,
      source TEXT,
      raw_data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ocr_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT,
      recognized_text TEXT,
      extracted_info TEXT,
      application_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
  console.log('✅ Database initialized');
  
  return db;
}

// 保存数据库到文件
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// 获取数据库实例
function getDb() {
  return db;
}

// 辅助函数：运行查询并返回结果
function run(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0];
  return { lastInsertRowid: lastId?.values[0]?.[0] || 0 };
}

// 辅助函数：获取单行
function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// 辅助函数：获取多行
function all(sql, params = []) {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

module.exports = {
  initDatabase,
  getDb,
  saveDatabase,
  run,
  get,
  all
};
