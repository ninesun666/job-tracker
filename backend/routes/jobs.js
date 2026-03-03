/**
 * 投递记录路由
 */

const express = require('express');
const router = express.Router();
const { run, get, all } = require('../models/database');

// 获取所有投递记录
router.get('/', (req, res) => {
  try {
    const { status, company, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM job_applications WHERE 1=1';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (company) {
      sql += ' AND company_name LIKE ?';
      params.push(`%${company}%`);
    }
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM job_applications WHERE 1=1';
    const countParams = [...params];
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const rows = all(sql, params);
    const countResult = get(countSql, countParams.slice(0, -2));
    
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
router.get('/:id', (req, res) => {
  try {
    const row = get('SELECT * FROM job_applications WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 创建投递记录
router.post('/', (req, res) => {
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

    const result = run(`
      INSERT INTO job_applications (
        company_name, company_scale, company_stock, company_founded, company_notes,
        position, position_description, position_requirements, self_match, notes,
        resume_sent, apply_date, status, source_platform,
        salary_range, location, hr_name, hr_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      company_name, company_scale, company_stock, company_founded, company_notes,
      position, position_description, position_requirements, self_match, notes,
      resume_sent ? 1 : 0, apply_date || new Date().toISOString().split('T')[0],
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
router.put('/:id', (req, res) => {
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
      hr_contact,
      interview_date,
      interview_result
    } = req.body;

    run(`
      UPDATE job_applications SET
        company_name = ?, company_scale = ?, company_stock = ?, company_founded = ?, company_notes = ?,
        position = ?, position_description = ?, position_requirements = ?, self_match = ?, notes = ?,
        resume_sent = ?, apply_date = ?, status = ?, source_platform = ?,
        salary_range = ?, location = ?, hr_name = ?, hr_contact = ?,
        interview_date = ?, interview_result = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      company_name, company_scale, company_stock, company_founded, company_notes,
      position, position_description, position_requirements, self_match, notes,
      resume_sent ? 1 : 0, apply_date, status, source_platform,
      salary_range, location, hr_name, hr_contact,
      interview_date, interview_result,
      req.params.id
    ]);

    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 删除投递记录
router.delete('/:id', (req, res) => {
  try {
    run('DELETE FROM job_applications WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 统计数据
router.get('/stats/overview', (req, res) => {
  try {
    const stats = {
      total: get('SELECT COUNT(*) as count FROM job_applications')?.count || 0,
      pending: get("SELECT COUNT(*) as count FROM job_applications WHERE status = 'pending'")?.count || 0,
      interviewing: get("SELECT COUNT(*) as count FROM job_applications WHERE status = 'interviewing'")?.count || 0,
      offered: get("SELECT COUNT(*) as count FROM job_applications WHERE status = 'offered'")?.count || 0,
      rejected: get("SELECT COUNT(*) as count FROM job_applications WHERE status = 'rejected'")?.count || 0,
      thisWeek: get("SELECT COUNT(*) as count FROM job_applications WHERE date(apply_date) >= date('now', '-7 days')")?.count || 0,
      thisMonth: get("SELECT COUNT(*) as count FROM job_applications WHERE date(apply_date) >= date('now', '-30 days')")?.count || 0
    };
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
