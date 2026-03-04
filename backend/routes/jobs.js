/**
 * 投递记录路由 - 带用户隔离
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { run, get, all } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'job-tracker-secret-key-change-in-production';

// 认证中间件
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: '请先登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token 无效或已过期' });
  }
}

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有投递记录
router.get('/', async (req, res) => {
  try {
    const { status, company, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.userId;
    
    let sql = 'SELECT * FROM job_applications WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (company) {
      sql += ` AND company_name LIKE $${paramIndex}`;
      params.push(`%${company}%`);
      paramIndex++;
    }
    
    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await get(countSql, params);
    
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const rows = await all(sql, params);
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((countResult?.total || 0) / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取单个记录
router.get('/:id', async (req, res) => {
  try {
    const row = await get('SELECT * FROM job_applications WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (!row) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 创建投递记录
router.post('/', async (req, res) => {
  try {
    const {
      company_name,
      company_scale,
      company_stock,
      company_founded,
      company_notes,
      position,
      position_description,
      position_requirements,
      self_match,
      notes,
      resume_sent,
      apply_date,
      status,
      source_platform,
      salary_range,
      location,
      hr_name,
      hr_contact
    } = req.body;

    const result = await run(`
      INSERT INTO job_applications (
        user_id, company_name, company_scale, company_stock, company_founded, company_notes,
        position, position_description, position_requirements, self_match, notes,
        resume_sent, apply_date, status, source_platform,
        salary_range, location, hr_name, hr_contact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `, [
      req.userId, company_name, company_scale, company_stock, company_founded, company_notes,
      position, position_description, position_requirements, self_match, notes,
      resume_sent ? true : false, apply_date || new Date().toISOString().split('T')[0],
      status || 'pending', source_platform, salary_range, location, hr_name, hr_contact
    ]);

    res.json({ 
      success: true, 
      data: { id: result.lastInsertRowid },
      message: '创建成功'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 更新投递记录
router.put('/:id', async (req, res) => {
  try {
    // 先检查是否属于当前用户
    const existing = await get('SELECT id FROM job_applications WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: '记录不存在或无权修改' });
    }

    const {
      company_name,
      company_scale,
      company_stock,
      company_founded,
      company_notes,
      position,
      position_description,
      position_requirements,
      self_match,
      notes,
      resume_sent,
      apply_date,
      status,
      source_platform,
      salary_range,
      location,
      hr_name,
      hr_contact,
      interview_date,
      interview_result
    } = req.body;

    await run(`
      UPDATE job_applications SET
        company_name = $1, company_scale = $2, company_stock = $3, company_founded = $4, company_notes = $5,
        position = $6, position_description = $7, position_requirements = $8, self_match = $9, notes = $10,
        resume_sent = $11, apply_date = $12, status = $13, source_platform = $14,
        salary_range = $15, location = $16, hr_name = $17, hr_contact = $18,
        interview_date = $19, interview_result = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21 AND user_id = $22
    `, [
      company_name, company_scale, company_stock, company_founded, company_notes,
      position, position_description, position_requirements, self_match, notes,
      resume_sent ? true : false, apply_date, status, source_platform,
      salary_range, location, hr_name, hr_contact,
      interview_date, interview_result,
      req.params.id, req.userId
    ]);

    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 删除投递记录
router.delete('/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM job_applications WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 统计数据
router.get('/stats/overview', async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = {
      total: (await get('SELECT COUNT(*) as count FROM job_applications WHERE user_id = $1', [userId]))?.count || 0,
      pending: (await get("SELECT COUNT(*) as count FROM job_applications WHERE user_id = $1 AND status = 'pending'", [userId]))?.count || 0,
      interviewing: (await get("SELECT COUNT(*) as count FROM job_applications WHERE user_id = $1 AND status = 'interviewing'", [userId]))?.count || 0,
      offered: (await get("SELECT COUNT(*) as count FROM job_applications WHERE user_id = $1 AND status = 'offered'", [userId]))?.count || 0,
      rejected: (await get("SELECT COUNT(*) as count FROM job_applications WHERE user_id = $1 AND status = 'rejected'", [userId]))?.count || 0,
      thisWeek: (await get("SELECT COUNT(*) as count FROM job_applications WHERE user_id = $1 AND apply_date >= CURRENT_DATE - INTERVAL '7 days'", [userId]))?.count || 0,
      thisMonth: (await get("SELECT COUNT(*) as count FROM job_applications WHERE user_id = $1 AND apply_date >= CURRENT_DATE - INTERVAL '30 days'", [userId]))?.count || 0
    };
    
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;