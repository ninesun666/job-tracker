/**
 * 公司调研路由
 */

const express = require('express');
const router = express.Router();
const { run, get, all } = require('../models/database');
const { searchCompany } = require('../services/companySearch');

// 搜索公司信息
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ success: false, error: '请提供公司名称' });
    }

    // 先查缓存
    const cached = get('SELECT * FROM company_cache WHERE company_name = ?', [name]);
    if (cached) {
      return res.json({ 
        success: true, 
        data: {
          name: cached.company_name,
          scale: cached.company_scale,
          stock: cached.company_stock,
          founded: cached.company_founded,
          industry: cached.company_industry,
          address: cached.company_address,
          description: cached.company_description
        },
        source: 'cache'
      });
    }

    // 调用搜索服务
    const companyInfo = await searchCompany(name);
    
    // 缓存结果
    if (companyInfo) {
      run(`
        INSERT OR REPLACE INTO company_cache 
        (company_name, company_scale, company_stock, company_founded, company_industry, company_address, company_description, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        companyInfo.scale,
        companyInfo.stock,
        companyInfo.founded,
        companyInfo.industry,
        companyInfo.address,
        companyInfo.description,
        companyInfo.source || 'api'
      ]);
    }

    res.json({ success: true, data: companyInfo, source: 'api' });
  } catch (err) {
    console.error('Company search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取缓存列表
router.get('/cache', (req, res) => {
  try {
    const rows = all('SELECT * FROM company_cache ORDER BY updated_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 清除缓存
router.delete('/cache', (req, res) => {
  try {
    run('DELETE FROM company_cache');
    res.json({ success: true, message: '缓存已清除' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;