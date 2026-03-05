/**
 * OCR 图片识别路由
 * 支持 GLM-4V、通义千问 VL、Claude、GPT-4V 等视觉模型
 * 添加用户隔离支持
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// 配置文件上传
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('只支持图片文件'));
    }
    cb(null, true);
  }
});

/**
 * 获取 OCR 提供商
 * 优先级: OCR_PROVIDER 环境变量 > 自动检测
 */
function getOCRProvider() {
  const provider = process.env.OCR_PROVIDER?.toLowerCase();
  
  // 明确指定提供商 - 最高优先级
  if (provider === 'qwen' && process.env.LLM_API_KEY) {
    return 'qwen';
  }
  if (provider === 'glm' && process.env.GLM_API_KEY) {
    return 'glm';
  }
  if (provider === 'claude' && process.env.ANTHROPIC_API_KEY) {
    return 'claude';
  }
  if (provider === 'openai' && process.env.LLM_API_KEY) {
    return 'openai';
  }
  
  // 自动检测 - 根据 URL 和模型名称判断
  const apiUrl = process.env.LLM_API_URL || '';
  const model = process.env.LLM_MODEL || '';
  
  if (process.env.LLM_API_KEY) {
    if (apiUrl.includes('dashscope') || apiUrl.includes('bailian') || model.includes('qwen')) {
      return 'qwen';
    }
    if (model.includes('glm') || apiUrl.includes('bigmodel')) {
      return 'glm';
    }
    return 'openai';
  }
  
  if (process.env.GLM_API_KEY) {
    return 'glm';
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    return 'claude';
  }
  
  return null;
}

/**
 * 获取 LLM 提供商（用于文本分析）
 */
function getLLMProvider() {
  // 优先使用 OCR 的配置
  if (process.env.LLM_API_KEY) {
    return 'llm';
  }
  if (process.env.GLM_API_KEY) {
    return 'glm';
  }
  return null;
}

/**
 * 上传并识别图片
 * POST /api/ocr/recognize
 * 需要登录
 */
router.post('/recognize', authMiddleware, upload.single('image'), async (req, res) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const startTime = Date.now();
  
  console.log(`[${requestId}] ========== OCR 请求开始 ==========`);
  console.log(`[${requestId}] 用户ID: ${req.userId}`);
  console.log(`[${requestId}] 文件信息: ${req.file ? `${req.file.originalname} (${(req.file.size / 1024).toFixed(2)}KB, ${req.file.mimetype})` : '无文件'}`);
  
  try {
    if (!req.file) {
      console.log(`[${requestId}] 错误: 未上传图片`);
      return res.status(400).json({ success: false, error: '请上传图片' });
    }

    const step1Start = Date.now();
    const imagePath = req.file.path;
    const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
    const mimeType = req.file.mimetype;
    console.log(`[${requestId}] 步骤1 - 读取图片完成, 耗时: ${Date.now() - step1Start}ms, Base64长度: ${imageBase64.length}`);

    const provider = getOCRProvider();
    console.log(`[${requestId}] 使用 OCR 提供商: ${provider || '未配置'}`);
    
    if (!provider) {
      console.log(`[${requestId}] 错误: 未配置 OCR 服务`);
      return res.json({
        success: false,
        error: '未配置 OCR 服务',
        data: getDefaultResult('请配置 LLM_API_KEY')
      });
    }
    
    const step2Start = Date.now();
    let result;
    
    switch (provider) {
      case 'qwen':
        result = await recognizeWithQwen(imageBase64, mimeType, requestId);
        break;
      case 'glm':
        result = await recognizeWithGLM(imageBase64, mimeType, requestId);
        break;
      case 'claude':
        result = await recognizeWithClaude(imageBase64, mimeType, requestId);
        break;
      case 'openai':
        result = await recognizeWithOpenAI(imageBase64, mimeType, requestId);
        break;
      default:
        result = {
          success: false,
          error: '未配置 OCR 服务',
          data: getDefaultResult('请配置 LLM_API_KEY')
        };
    }
    console.log(`[${requestId}] 步骤2 - OCR 识别完成, 耗时: ${Date.now() - step2Start}ms, 成功: ${result.success}`);

    // 识别成功后，查询公司背景信息
    if (result.success && result.data?.company_name) {
      const step3Start = Date.now();
      console.log(`[${requestId}] 步骤3 - 查询公司背景: ${result.data.company_name}`);
      const companyNotes = await queryCompanyBackground(result.data.company_name, requestId);
      if (companyNotes) {
        result.data.company_notes = companyNotes;
      }
      console.log(`[${requestId}] 步骤3 - 公司背景查询完成, 耗时: ${Date.now() - step3Start}ms`);
    }

    // 保存识别历史（关联用户）
    const step4Start = Date.now();
    try {
      await run(`
        INSERT INTO ocr_history (user_id, image_path, recognized_text, extracted_info)
        VALUES ($1, $2, $3, $4)
      `, [req.userId, imagePath, JSON.stringify(result.data?.rawResponse || ''), JSON.stringify(result.data)]);
      console.log(`[${requestId}] 步骤4 - 保存历史完成, 耗时: ${Date.now() - step4Start}ms`);
    } catch (e) {
      console.error(`[${requestId}] 保存历史失败:`, e);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[${requestId}] ========== OCR 请求完成, 总耗时: ${totalTime}ms ==========`);
    
    res.json({ 
      success: result.success,
      data: result.data,
      error: result.error,
      provider,
      imagePath: `/uploads/${path.basename(imagePath)}`,
      _debug: { requestId, totalTime, provider }
    });
  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error(`[${requestId}] OCR 错误, 耗时: ${totalTime}ms:`, err);
    res.status(500).json({ success: false, error: err.message, _debug: { requestId, totalTime } });
  }
});

/**
 * 查询公司背景信息
 * 使用 LLM 分析公司是否为大厂子公司/外包等
 */
async function queryCompanyBackground(companyName, requestId = 'no-id') {
  const stepStart = Date.now();
  const llmProvider = getLLMProvider();
  if (!llmProvider) {
    console.log(`[${requestId}] 公司背景查询: 无可用 LLM 提供商`);
    return null;
  }

  console.log(`[${requestId}] 公司背景查询: 使用 ${llmProvider} 提供商`);

  const prompt = `请分析"${companyName}"这家公司的背景信息，回答以下问题：
1. 这家公司是否是知名大厂的子公司或关联公司？如果是，请说明母公司是谁。
2. 这家公司是否是外包公司或人力派遣公司？
3. 这家公司的主营业务是什么？在行业内的地位如何？
4. 有什么求职者需要注意的信息？（如加班文化、薪资水平、发展前景等）

请用简洁的中文回答，不超过200字。如果不确定，请说明"信息不足"。`;

  try {
    const fetch = require('node-fetch');
    
    let apiUrl, apiKey, model;
    
    if (llmProvider === 'llm') {
      apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
      apiKey = process.env.LLM_API_KEY;
      model = process.env.LLM_MODEL || 'gpt-4o';
    } else {
      apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
      apiKey = process.env.GLM_API_KEY;
      model = 'glm-4-flash';
    }

    console.log(`[${requestId}] 公司背景查询: 发起 API 请求 -> ${apiUrl}`);
    const fetchStart = Date.now();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      })
    });

    console.log(`[${requestId}] 公司背景查询: API 响应状态 ${response.status}, 耗时 ${Date.now() - fetchStart}ms`);

    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        console.log(`[${requestId}] 公司背景查询: 成功获取结果, 总耗时 ${Date.now() - stepStart}ms`);
        return data.choices[0].message.content;
      }
    } else {
      const errorText = await response.text();
      console.error(`[${requestId}] 公司背景查询: API 错误 ${response.status} - ${errorText}`);
    }
  } catch (err) {
    console.error(`[${requestId}] 公司背景查询异常, 耗时 ${Date.now() - stepStart}ms:`, err);
  }
  
  return null;
}

/**
 * 获取默认结果结构
 */
function getDefaultResult(note = '') {
  return {
    company_name: '',
    company_notes: '',
    position: '',
    position_description: '',
    position_requirements: [],
    salary_range: '',
    location: '',
    company_scale: '',
    source_platform: '',
    hr_name: '',
    benefits: [],
    note
  };
}

/**
 * 使用通义千问 VL / GLM API 识别 (OpenAI 兼容格式)
 */
async function recognizeWithQwen(imageBase64, mimeType, requestId = 'no-id') {
  const stepStart = Date.now();
  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  const model = process.env.LLM_MODEL || 'qwen-vl-plus';
  
  console.log(`[${requestId}] Qwen OCR: 开始识别`);
  console.log(`[${requestId}] Qwen OCR: API URL = ${apiUrl}`);
  console.log(`[${requestId}] Qwen OCR: Model = ${model}`);
  console.log(`[${requestId}] Qwen OCR: 图片大小 = ${(imageBase64.length / 1024).toFixed(2)}KB`);
  
  const prompt = `请识别这张招聘截图，提取以下信息并以JSON格式返回：
1. company_name: 公司名称
2. position: 职位名称
3. position_description: 职位描述（岗位职责描述，原文提取）
4. position_requirements: 职位要求（数组形式，列出关键技能和经验要求）
5. salary_range: 薪资范围
6. location: 工作地点
7. company_scale: 公司规模（如"100-499人"）
8. source_platform: 来源平台（如BOSS直聘、智联招聘等）
9. hr_name: HR姓名（如果有）
10. benefits: 福利待遇（数组形式）

注意：
- position_description 和 position_requirements 要分开
- position_description 是岗位做什么的
- position_requirements 是需要什么技能/经验
- 如果无法区分，position_description 填完整描述，position_requirements 提取关键要求

请只返回有效的JSON格式，不要包含其他说明文字或markdown标记。`;

  try {
    const fetch = require('node-fetch');
    
    console.log(`[${requestId}] Qwen OCR: 发起 API 请求...`);
    const fetchStart = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
          ]
        }],
        max_tokens: 2000
      })
    });

    console.log(`[${requestId}] Qwen OCR: API 响应状态 = ${response.status}, 耗时 ${Date.now() - fetchStart}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Qwen OCR: API 错误 ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `API 错误: ${response.status} - ${errorText}`,
        data: getDefaultResult('API 调用失败')
      };
    }

    const parseStart = Date.now();
    const data = await response.json();
    console.log(`[${requestId}] Qwen OCR: JSON 解析完成, 耗时 ${Date.now() - parseStart}ms`);
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      const parsed = parseJsonResponse(content);
      
      console.log(`[${requestId}] Qwen OCR: 识别成功, 总耗时 ${Date.now() - stepStart}ms`);
      console.log(`[${requestId}] Qwen OCR: Token 使用 - prompt: ${data.usage?.prompt_tokens}, completion: ${data.usage?.completion_tokens}`);
      
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
    
    console.error(`[${requestId}] Qwen OCR: 响应格式异常, 总耗时 ${Date.now() - stepStart}ms`);
    return { success: false, error: '响应格式异常', data: getDefaultResult('识别结果解析失败') };
  } catch (err) {
    console.error(`[${requestId}] Qwen OCR 异常, 耗时 ${Date.now() - stepStart}ms:`, err);
    return { success: false, error: err.message, data: getDefaultResult('识别过程中发生错误') };
  }
}

/**
 * 使用智谱 GLM API 识别
 */
async function recognizeWithGLM(imageBase64, mimeType, requestId = 'no-id') {
  const stepStart = Date.now();
  const apiKey = process.env.GLM_API_KEY;
  const apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  const model = process.env.GLM_MODEL || 'glm-4v-flash';
  
  console.log(`[${requestId}] GLM OCR: 开始识别`);
  console.log(`[${requestId}] GLM OCR: API URL = ${apiUrl}`);
  console.log(`[${requestId}] GLM OCR: Model = ${model}`);
  console.log(`[${requestId}] GLM OCR: 图片大小 = ${(imageBase64.length / 1024).toFixed(2)}KB`);
  
  const prompt = `请识别这张招聘截图，提取以下信息并以JSON格式返回：
1. company_name: 公司名称
2. position: 职位名称
3. position_description: 职位描述（岗位职责描述）
4. position_requirements: 职位要求（数组形式，关键技能和经验要求）
5. salary_range: 薪资范围
6. location: 工作地点
7. company_scale: 公司规模
8. source_platform: 来源平台
9. hr_name: HR姓名
10. benefits: 福利待遇（数组形式）

请只返回有效的JSON格式。`;

  try {
    const fetch = require('node-fetch');
    
    console.log(`[${requestId}] GLM OCR: 发起 API 请求...`);
    const fetchStart = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
          ]
        }],
        max_tokens: 2000
      })
    });

    console.log(`[${requestId}] GLM OCR: API 响应状态 = ${response.status}, 耗时 ${Date.now() - fetchStart}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] GLM OCR: API 错误 ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `GLM API 错误: ${response.status}`,
        data: getDefaultResult('API 调用失败')
      };
    }

    const parseStart = Date.now();
    const data = await response.json();
    console.log(`[${requestId}] GLM OCR: JSON 解析完成, 耗时 ${Date.now() - parseStart}ms`);
    
    if (data.choices && data.choices[0]?.message?.content) {
      const content = data.choices[0].message.content;
      const parsed = parseJsonResponse(content);
      
      console.log(`[${requestId}] GLM OCR: 识别成功, 总耗时 ${Date.now() - stepStart}ms`);
      console.log(`[${requestId}] GLM OCR: Token 使用 - prompt: ${data.usage?.prompt_tokens}, completion: ${data.usage?.completion_tokens}`);
      
      return {
        success: true,
        data: {
          ...getDefaultResult(),
          ...parsed,
          rawResponse: content
        }
      };
    }
    
    console.error(`[${requestId}] GLM OCR: 响应格式异常, 总耗时 ${Date.now() - stepStart}ms`);
    return { success: false, error: 'GLM 响应解析失败', data: getDefaultResult() };
  } catch (err) {
    console.error(`[${requestId}] GLM OCR 异常, 耗时 ${Date.now() - stepStart}ms:`, err);
    return { success: false, error: err.message, data: getDefaultResult() };
  }
}

/**
 * 使用 Claude Vision API 识别
 */
async function recognizeWithClaude(imageBase64, mimeType, requestId = 'no-id') {
  const stepStart = Date.now();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const apiUrl = 'https://api.anthropic.com/v1/messages';
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
  
  console.log(`[${requestId}] Claude OCR: 开始识别`);
  console.log(`[${requestId}] Claude OCR: API URL = ${apiUrl}`);
  console.log(`[${requestId}] Claude OCR: Model = ${model}`);
  console.log(`[${requestId}] Claude OCR: 图片大小 = ${(imageBase64.length / 1024).toFixed(2)}KB`);
  
  const mediaType = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  const prompt = `请识别这张招聘截图，提取以下信息并以JSON格式返回：
1. company_name: 公司名称
2. position: 职位名称
3. position_description: 职位描述
4. position_requirements: 职位要求（数组形式）
5. salary_range: 薪资范围
6. location: 工作地点
7. company_scale: 公司规模
8. source_platform: 来源平台
请只返回JSON，不要其他说明文字。`;
  
  try {
    const fetch = require('node-fetch');
    
    console.log(`[${requestId}] Claude OCR: 发起 API 请求...`);
    const fetchStart = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    console.log(`[${requestId}] Claude OCR: API 响应状态 = ${response.status}, 耗时 ${Date.now() - fetchStart}ms`);

    const parseStart = Date.now();
    const data = await response.json();
    console.log(`[${requestId}] Claude OCR: JSON 解析完成, 耗时 ${Date.now() - parseStart}ms`);
    
    if (data.content && data.content[0]) {
      const content = data.content[0].text;
      const parsed = parseJsonResponse(content);
      
      console.log(`[${requestId}] Claude OCR: 识别成功, 总耗时 ${Date.now() - stepStart}ms`);
      console.log(`[${requestId}] Claude OCR: Token 使用 - input: ${data.usage?.input_tokens}, output: ${data.usage?.output_tokens}`);
      
      return { success: true, data: { ...getDefaultResult(), ...parsed } };
    }
    
    console.error(`[${requestId}] Claude OCR: 响应格式异常, 总耗时 ${Date.now() - stepStart}ms`);
    return { success: false, error: 'Claude 解析失败', data: getDefaultResult() };
  } catch (err) {
    console.error(`[${requestId}] Claude OCR 异常, 耗时 ${Date.now() - stepStart}ms:`, err);
    return { success: false, error: err.message, data: getDefaultResult() };
  }
}

/**
 * 使用 OpenAI GPT-4V 识别
 */
async function recognizeWithOpenAI(imageBase64, mimeType, requestId = 'no-id') {
  const stepStart = Date.now();
  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.LLM_MODEL || 'gpt-4o';
  
  console.log(`[${requestId}] OpenAI OCR: 开始识别`);
  console.log(`[${requestId}] OpenAI OCR: API URL = ${apiUrl}`);
  console.log(`[${requestId}] OpenAI OCR: Model = ${model}`);
  console.log(`[${requestId}] OpenAI OCR: 图片大小 = ${(imageBase64.length / 1024).toFixed(2)}KB`);
  
  const prompt = `请识别这张招聘截图，提取以下信息并以JSON格式返回：
1. company_name: 公司名称
2. position: 职位名称
3. position_description: 职位描述
4. position_requirements: 职位要求（数组形式）
5. salary_range: 薪资范围
6. location: 工作地点
7. company_scale: 公司规模
8. source_platform: 来源平台
请只返回JSON，不要其他说明文字。`;
  
  try {
    const fetch = require('node-fetch');
    
    console.log(`[${requestId}] OpenAI OCR: 发起 API 请求...`);
    const fetchStart = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
          ]
        }],
        max_tokens: 2000
      })
    });

    console.log(`[${requestId}] OpenAI OCR: API 响应状态 = ${response.status}, 耗时 ${Date.now() - fetchStart}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] OpenAI OCR: API 错误 ${response.status} - ${errorText}`);
      return { success: false, error: `API 错误: ${response.status}`, data: getDefaultResult() };
    }

    const parseStart = Date.now();
    const data = await response.json();
    console.log(`[${requestId}] OpenAI OCR: JSON 解析完成, 耗时 ${Date.now() - parseStart}ms`);
    
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;
      const parsed = parseJsonResponse(content);
      
      console.log(`[${requestId}] OpenAI OCR: 识别成功, 总耗时 ${Date.now() - stepStart}ms`);
      console.log(`[${requestId}] OpenAI OCR: Token 使用 - prompt: ${data.usage?.prompt_tokens}, completion: ${data.usage?.completion_tokens}`);
      
      return { success: true, data: { ...getDefaultResult(), ...parsed } };
    }
    
    console.error(`[${requestId}] OpenAI OCR: 响应格式异常, 总耗时 ${Date.now() - stepStart}ms`);
    return { success: false, error: 'OpenAI 解析失败', data: getDefaultResult() };
  } catch (err) {
    console.error(`[${requestId}] OpenAI OCR 异常, 耗时 ${Date.now() - stepStart}ms:`, err);
    return { success: false, error: err.message, data: getDefaultResult() };
  }
}

/**
 * 从响应中解析 JSON
 */
function parseJsonResponse(content) {
  try {
    return JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {}
    }
    
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
 * 获取 OCR 服务状态
 * GET /api/ocr/status
 */
router.get('/status', async (req, res) => {
  const provider = getOCRProvider();
  
  let available = false;
  if (provider) {
    available = !!(process.env.LLM_API_KEY || process.env.GLM_API_KEY || process.env.ANTHROPIC_API_KEY);
  }

  res.json({
    success: true,
    provider,
    available,
    config: {
      apiUrl: process.env.LLM_API_URL ? '(已配置)' : '(未配置)',
      model: process.env.LLM_MODEL || 'default'
    }
  });
});

/**
 * 获取识别历史
 * GET /api/ocr/history
 * 需要登录，只返回当前用户的历史
 */
router.get('/history', authMiddleware, (req, res) => {
  try {
    const rows = all('SELECT * FROM ocr_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.userId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 测试 OCR 服务
 * GET /api/ocr/test
 */
router.get('/test', async (req, res) => {
  const provider = getOCRProvider();
  
  if (!provider) {
    return res.json({
      success: false,
      error: '未配置 OCR 服务',
      hint: '请设置 LLM_API_KEY'
    });
  }

  res.json({
    success: true,
    provider,
    message: `OCR 服务已就绪，当前使用 ${provider.toUpperCase()} 模型`,
    config: {
      model: process.env.LLM_MODEL || 'default',
      apiUrl: process.env.LLM_API_URL || 'default'
    }
  });
});

module.exports = router;
