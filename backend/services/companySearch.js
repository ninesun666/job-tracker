/**
 * 公司搜索服务
 * 支持多种数据源：天眼查、企查查、爱企查等
 */

const fetch = require('node-fetch');

/**
 * 搜索公司信息
 * @param {string} companyName - 公司名称
 * @returns {Object} - 公司信息
 */
async function searchCompany(companyName) {
  // 方案1: 使用公开API（如果有的话）
  // 方案2: 模拟数据（开发阶段）
  // 方案3: 用户手动补充

  try {
    // 尝试调用天眼查开放API（需要申请key）
    // const tianyanchaData = await searchFromTianyancha(companyName);
    
    // 暂时返回模拟数据结构，实际使用时接入真实API
    return await searchFromWeb(companyName);
  } catch (err) {
    console.error('Search company error:', err);
    return null;
  }
}

/**
 * 从网络搜索公司信息（使用公开数据）
 */
async function searchFromWeb(companyName) {
  // 模拟API调用 - 实际生产环境需要接入真实API
  // 这里返回一个基础结构，让用户可以手动补充
  
  const baseInfo = {
    name: companyName,
    scale: null,
    stock: null,        // '已上市' / '未上市' / '新三板' 等
    founded: null,
    industry: null,
    address: null,
    description: null,
    source: 'manual'    // 标记为需要手动补充
  };

  // 尝试从百科或其他公开来源获取基本信息
  try {
    // 可以接入：
    // 1. 天眼查开放平台 API (https://open.tianyancha.com/)
    // 2. 企查查 API (https://openapi.qcc.com/)
    // 3. 爱企查 (https://aiqicha.baidu.com/)
    
    // 示例：简单的网络搜索逻辑
    const searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(companyName + ' 公司简介')}`;
    
    // 实际项目中使用 puppeteer 或其他爬虫工具获取信息
    // 这里仅作为示例返回基础结构
    
  } catch (err) {
    console.error('Web search error:', err);
  }

  return baseInfo;
}

/**
 * 天眼查API搜索（需要API Key）
 */
async function searchFromTianyancha(companyName) {
  const API_KEY = process.env.TIANYANCHA_API_KEY;
  if (!API_KEY) {
    throw new Error('未配置天眼查API Key');
  }

  const url = `https://open.api.tianyancha.com/services/open/search/2.0?word=${encodeURIComponent(companyName)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': API_KEY
    }
  });

  const data = await response.json();
  
  if (data && data.result && data.result.items && data.result.items.length > 0) {
    const item = data.result.items[0];
    return {
      name: item.name,
      scale: item.regStatus || null,  // 企业状态
      stock: item.isMicroEnt ? '未上市' : '疑似上市',
      founded: item.estiblishTime || null,
      industry: item.industry || null,
      address: item.address || null,
      description: item.businessScope || null,
      source: 'tianyancha'
    };
  }

  return null;
}

/**
 * 企查查API搜索（需要API Key）
 */
async function searchFromQcc(companyName) {
  const API_KEY = process.env.QCC_API_KEY;
  if (!API_KEY) {
    throw new Error('未配置企查查API Key');
  }

  // 企查查API调用逻辑
  // 参考: https://openapi.qcc.com/
  
  return null;
}

/**
 * 智能推断公司规模
 */
function inferCompanyScale(employeeCount) {
  if (!employeeCount) return null;
  
  const count = parseInt(employeeCount);
  if (count < 50) return '0-50人';
  if (count < 150) return '50-150人';
  if (count < 500) return '150-500人';
  if (count < 1000) return '500-1000人';
  return '1000人以上';
}

module.exports = {
  searchCompany,
  searchFromTianyancha,
  searchFromQcc
};