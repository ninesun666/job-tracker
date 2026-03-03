/**
 * 公司调研服务
 * 支持多种数据源：企查查、天眼查、爱企查等
 */

const fetch = require('node-fetch');

class CompanyService {
  constructor() {
    this.cacheEnabled = true;
  }

  /**
   * 查询公司信息
   * @param {string} companyName 公司名称
   * @returns {Promise<Object>} 公司信息
   */
  async searchCompany(companyName) {
    // 1. 先查缓存
    const db = require('../models/database');
    const cached = db.prepare('SELECT * FROM company_cache WHERE company_name = ?').get(companyName);
    
    if (cached && this.cacheEnabled) {
      console.log(`📦 使用缓存的公司信息: ${companyName}`);
      return {
        ...cached,
        from_cache: true
      };
    }

    // 2. 调用 API 查询
    try {
      const companyInfo = await this.fetchFromQCC(companyName);
      
      // 3. 存入缓存
      if (companyInfo) {
        this.saveToCache(companyInfo);
        return companyInfo;
      }
    } catch (err) {
      console.error('企查查查询失败:', err.message);
    }

    // 4. 尝试其他数据源
    try {
      const companyInfo = await this.fetchFromTianyancha(companyName);
      if (companyInfo) {
        this.saveToCache(companyInfo);
        return companyInfo;
      }
    } catch (err) {
      console.error('天眼查查询失败:', err.message);
    }

    // 5. 返回默认值
    return {
      company_name: companyName,
      company_scale: '未知',
      company_stock: '未知',
      company_founded: '未知',
      source: '手动录入'
    };
  }

  /**
   * 从企查查获取公司信息
   * 注意：实际使用需要申请 API Key
   */
  async fetchFromQCC(companyName) {
    const QCC_API_KEY = process.env.QCC_API_KEY;
    if (!QCC_API_KEY) {
      console.log('⚠️ 未配置企查查 API Key，跳过');
      return null;
    }

    // 模拟 API 调用（实际需要对接企查查 API）
    // 文档：https://openapi.qcc.com/
    return null;
  }

  /**
   * 从天眼查获取公司信息
   * 注意：实际使用需要申请 API Key
   */
  async fetchFromTianyancha(companyName) {
    const TIANYANCHA_API_KEY = process.env.TIANYANCHA_API_KEY;
    if (!TIANYANCHA_API_KEY) {
      console.log('⚠️ 未配置天眼查 API Key，跳过');
      return null;
    }

    // 模拟 API 调用
    // 文档：https://open.tianyancha.com/
    return null;
  }

  /**
   * 从爱企查爬取（备用方案）
   * 注意：仅供学习参考，实际使用请遵守相关法律法规
   */
  async fetchFromAiQicha(companyName) {
    try {
      const response = await fetch(`https://aiqicha.baidu.com/s?q=${encodeURIComponent(companyName)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      // 解析页面...
      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * 手动更新公司信息
   */
  async updateCompanyInfo(companyName, info) {
    const db = require('../models/database');
    
    const stmt = db.prepare(`
      INSERT INTO company_cache (
        company_name, company_scale, company_stock, company_founded,
        company_industry, company_address, company_description, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(company_name) DO UPDATE SET
        company_scale = excluded.company_scale,
        company_stock = excluded.company_stock,
        company_founded = excluded.company_founded,
        company_industry = excluded.company_industry,
        company_address = excluded.company_address,
        company_description = excluded.company_description,
        source = excluded.source,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      companyName,
      info.company_scale,
      info.company_stock,
      info.company_founded,
      info.company_industry,
      info.company_address,
      info.company_description,
      info.source || '手动录入'
    );

    return { success: true, message: '公司信息已更新' };
  }

  /**
   * 保存到缓存
   */
  saveToCache(companyInfo) {
    const db = require('../models/database');
    
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO company_cache (
          company_name, company_scale, company_stock, company_founded,
          company_industry, company_address, company_description, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        companyInfo.company_name,
        companyInfo.company_scale,
        companyInfo.company_stock,
        companyInfo.company_founded,
        companyInfo.company_industry,
        companyInfo.company_address,
        companyInfo.company_description,
        companyInfo.source || 'API'
      );
    } catch (err) {
      console.error('保存缓存失败:', err.message);
    }
  }

  /**
   * 根据关键词推断公司规模
   */
  inferScale(text) {
    if (!text) return '未知';
    
    const scaleMap = {
      '100人以下': ['1-49人', '1-99人', '少于50人', '微型', '初创'],
      '100-499人': ['100-499人', '100-299人', '100-499人', '小型'],
      '500-999人': ['500-999人', '500-999人', '中型'],
      '1000-9999人': ['1000-9999人', '1000-4999人', '5000-9999人', '大型'],
      '10000人以上': ['10000人以上', '万人以上', '超大型', '巨头']
    };

    for (const [scale, keywords] of Object.entries(scaleMap)) {
      if (keywords.some(k => text.includes(k))) {
        return scale;
      }
    }

    return '未知';
  }

  /**
   * 推断是否上市公司
   */
  inferStockStatus(text) {
    if (!text) return '未知';
    
    const listed = ['上市', 'A股', '港股', '美股', '科创板', '创业板', '纳斯达克', 'NYSE', '股票代码'];
    const unlisted = ['未上市', '非上市', '民营', '私营'];
    
    if (listed.some(k => text.includes(k))) return '已上市';
    if (unlisted.some(k => text.includes(k))) return '未上市';
    
    return '未知';
  }
}

module.exports = new CompanyService();