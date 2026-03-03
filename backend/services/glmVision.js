/**
 * GLM Vision OCR 服务
 * 使用智谱 GLM-4V 模型进行图片识别
 */

const fetch = require('node-fetch');

// GLM API 配置
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

/**
 * 使用 GLM-4V 识别招聘截图
 * @param {string} imageBase64 - Base64 编码的图片
 * @param {string} mimeType - 图片 MIME 类型
 * @returns {Promise<Object>} 识别结果
 */
async function recognizeWithGLM(imageBase64, mimeType) {
  const apiKey = process.env.GLM_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: 'GLM_API_KEY 未配置',
      data: getDefaultResult('请配置 GLM_API_KEY 以启用图片识别')
    };
  }

  const prompt = `请识别这张招聘截图，提取以下信息并以JSON格式返回：
1. company_name: 公司名称
2. position: 职位名称
3. salary_range: 薪资范围
4. location: 工作地点
5. position_requirements: 职位要求（数组形式，列出关键要求）
6. company_scale: 公司规模（如果能看到，如"100-499人"）
7. source_platform: 来源平台（如BOSS直聘、智联招聘、前程无忧等）
8. hr_name: HR姓名（如果有）
9. benefits: 福利待遇（数组形式，如["五险一金", "带薪年假"]）

请只返回有效的JSON格式，不要包含其他说明文字或markdown标记。`;

  try {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.GLM_MODEL || 'glm-4v-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GLM API error:', response.status, errorText);
      return {
        success: false,
        error: `GLM API 错误: ${response.status}`,
        data: getDefaultResult('API 调用失败')
      };
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      const parsed = parseJsonResponse(content);
      
      return {
        success: true,
        data: {
          ...getDefaultResult(),
          ...parsed,
          rawResponse: content,
          model: data.model,
          usage: data.usage
        }
      };
    }

    return {
      success: false,
      error: 'GLM 响应格式异常',
      data: getDefaultResult('识别结果解析失败')
    };
  } catch (err) {
    console.error('GLM Vision error:', err);
    return {
      success: false,
      error: err.message,
      data: getDefaultResult('识别过程中发生错误')
    };
  }
}

/**
 * 从响应中解析 JSON
 * @param {string} content - API 响应内容
 * @returns {Object} 解析后的对象
 */
function parseJsonResponse(content) {
  try {
    // 尝试直接解析
    return JSON.parse(content);
  } catch (e) {
    // 尝试提取 JSON 块
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {}
    }
    
    // 尝试提取花括号内容
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch (e3) {}
    }
  }
  
  return {};
}

/**
 * 获取默认结果结构
 * @param {string} note - 备注信息
 * @returns {Object} 默认结果
 */
function getDefaultResult(note = '') {
  return {
    company_name: '',
    position: '',
    salary_range: '',
    location: '',
    position_requirements: [],
    company_scale: '',
    source_platform: '',
    hr_name: '',
    benefits: [],
    note
  };
}

/**
 * 检查 GLM API 是否可用
 * @returns {Promise<boolean>}
 */
async function checkGLMAvailability() {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) return false;
  
  try {
    // 发送一个简单请求检查连接
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 10
      })
    });
    return response.ok;
  } catch (err) {
    return false;
  }
}

module.exports = {
  recognizeWithGLM,
  checkGLMAvailability,
  getDefaultResult,
  GLM_API_URL
};
