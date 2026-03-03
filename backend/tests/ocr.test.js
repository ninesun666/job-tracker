/**
 * GLM Vision OCR 服务单元测试
 * 运行: node tests/ocr.test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// 模拟环境变量
process.env.GLM_API_KEY = process.env.GLM_API_KEY || 'test_key';
process.env.GLM_MODEL = 'glm-4v-flash';

// 引入被测模块
const { 
  recognizeWithGLM, 
  checkGLMAvailability, 
  getDefaultResult,
  GLM_API_URL 
} = require('../services/glmVision');

console.log('🧪 GLM Vision OCR 单元测试\n');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${err.message}`);
    failed++;
  }
}

// ==================== 测试开始 ====================

console.log('\n📋 基础功能测试\n');

// 测试 API URL
test('GLM API URL 配置正确', () => {
  assert.strictEqual(GLM_API_URL, 'https://open.bigmodel.cn/api/paas/v4/chat/completions');
});

// 测试默认结果结构
test('getDefaultResult 返回正确的结构', () => {
  const result = getDefaultResult('测试备注');
  
  assert.strictEqual(typeof result, 'object');
  assert.strictEqual(result.company_name, '');
  assert.strictEqual(result.position, '');
  assert.strictEqual(result.salary_range, '');
  assert.strictEqual(result.location, '');
  assert.strictEqual(Array.isArray(result.position_requirements), true);
  assert.strictEqual(result.note, '测试备注');
});

test('getDefaultResult 包含所有必要字段', () => {
  const result = getDefaultResult();
  const requiredFields = [
    'company_name', 'position', 'salary_range', 'location',
    'position_requirements', 'company_scale', 'source_platform',
    'hr_name', 'benefits', 'note'
  ];
  
  requiredFields.forEach(field => {
    assert.ok(field in result, `缺少字段: ${field}`);
  });
});

console.log('\n📋 错误处理测试\n');

// 测试无 API Key 时的处理
asyncTest('无 API Key 时返回错误', async () => {
  const originalKey = process.env.GLM_API_KEY;
  delete process.env.GLM_API_KEY;
  
  const result = await recognizeWithGLM('base64image', 'image/png');
  
  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('GLM_API_KEY'));
  
  process.env.GLM_API_KEY = originalKey;
});

// 测试无效 Base64 图片
asyncTest('无效图片数据时正常处理', async () => {
  // 需要 mock 或跳过实际 API 调用
  // 这里测试函数不会崩溃
  const result = await recognizeWithGLM('invalid_base64', 'image/png');
  
  // 应该返回一个结果对象，不论成功与否
  assert.ok(result.hasOwnProperty('success'));
  assert.ok(result.hasOwnProperty('data'));
});

console.log('\n📋 JSON 解析测试\n');

// 测试 JSON 解析（通过 getDefaultResult 间接测试）
test('默认结果可被 JSON 序列化', () => {
  const result = getDefaultResult();
  const json = JSON.stringify(result);
  const parsed = JSON.parse(json);
  
  assert.deepStrictEqual(result, parsed);
});

console.log('\n📋 集成测试\n');

// 测试 checkGLMAvailability
asyncTest('checkGLMAvailability 返回布尔值', async () => {
  const available = await checkGLMAvailability();
  assert.strictEqual(typeof available, 'boolean');
});

// 如果有真实 API Key，进行实际识别测试
if (process.env.GLM_API_KEY && process.env.GLM_API_KEY !== 'test_key') {
  console.log('\n📋 实际 API 测试 (需要真实 API Key)\n');
  
  // 创建一个简单的测试图片（1x1 像素 PNG）
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  asyncTest('GLM API 实际调用（可能失败）', async () => {
    const result = await recognizeWithGLM(testImageBase64, 'image/png');
    
    // 应该返回结果对象
    assert.ok(result.hasOwnProperty('success'));
    assert.ok(result.hasOwnProperty('data'));
    
    if (result.success) {
      console.log('   📸 识别成功！');
    } else {
      console.log(`   ⚠️ 识别失败: ${result.error}`);
    }
  });
} else {
  console.log('\n⏭️  跳过实际 API 测试 (未配置真实 GLM_API_KEY)\n');
}

// ==================== 测试总结 ====================

console.log('\n' + '='.repeat(50));
console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败\n`);

if (failed > 0) {
  process.exit(1);
}
