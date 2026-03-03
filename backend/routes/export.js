/**
 * Excel 导出路由
 */

const express = require('express');
const router = express.Router();
const { all } = require('../models/database');
const XLSX = require('xlsx');

// 导出所有投递记录
router.get('/excel', (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let sql = 'SELECT * FROM job_applications WHERE 1=1';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (startDate) {
      sql += ' AND apply_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND apply_date <= ?';
      params.push(endDate);
    }
    
    sql += ' ORDER BY apply_date DESC';
    
    const rows = all(sql, params);
    
    const excelData = rows.map(row => ({
      '公司名称': row.company_name,
      '公司规模': row.company_scale || '',
      '是否上市': row.company_stock || '',
      '成立时间': row.company_founded || '',
      '岗位名称': row.position,
      '职位要求': row.position_requirements || '',
      '自我对标': row.self_match || '',
      '备注': row.notes || '',
      '是否投递简历': row.resume_sent ? '是' : '否',
      '投递时间': row.apply_date || '',
      '状态': getStatusText(row.status),
      '薪资范围': row.salary_range || '',
      '工作地点': row.location || '',
      'HR姓名': row.hr_name || '',
      'HR联系方式': row.hr_contact || '',
      '面试时间': row.interview_date || '',
      '面试结果': row.interview_result || '',
      '来源平台': row.source_platform || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 20 }, { wch: 40 }, { wch: 30 }, { wch: 30 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '投递记录');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `面试投递记录_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function getStatusText(status) {
  const map = {
    'pending': '待处理',
    'applied': '已投递',
    'interviewing': '面试中',
    'offered': '已获offer',
    'rejected': '已拒绝',
    'withdrawn': '已撤回'
  };
  return map[status] || status;
}

module.exports = router;