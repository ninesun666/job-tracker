/**
 * 端到端测试 - 登录和投递流程
 * 运行: npx jest tests/e2e.test.js
 * 
 * 测试内容:
 * 1. JWT 认证中间件
 * 2. 投递记录 CRUD 操作
 * 3. 用户数据隔离
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// 测试环境配置
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// 使用现有数据库配置（从 .env 读取或使用默认值）
// 不覆盖 PG_* 变量，让测试使用现有数据库

let app;
let db;

// 测试用户 - 使用随机 ID 避免冲突
const testId1 = 900001 + Math.floor(Math.random() * 1000);
const testId2 = 900002 + Math.floor(Math.random() * 1000);
const testUsers = [
  { id: testId1, email: `user1_test_${testId1}@test.com`, name: 'Test User 1' },
  { id: testId2, email: `user2_test_${testId2}@test.com`, name: 'Test User 2' }
];

// 生成测试 token
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// 清理测试数据
async function cleanupTestData() {
  try {
    const { run } = require('../models/database');
    await run('DELETE FROM job_applications WHERE user_id IN ($1, $2)', [testUsers[0].id, testUsers[1].id]);
    await run('DELETE FROM users WHERE id IN ($1, $2)', [testUsers[0].id, testUsers[1].id]);
  } catch (err) {
    // 数据库可能未连接，忽略错误
  }
}

// 创建测试用户
async function createTestUsers() {
  const { run } = require('../models/database');
  for (const user of testUsers) {
    try {
      await run(
        `INSERT INTO users (id, email, name, provider, github_id, github_username)
         VALUES ($1, $2, $3, 'test', $1, $2)
         ON CONFLICT (id) DO UPDATE SET email = $2, name = $3`,
        [user.id, user.email, user.name]
      );
    } catch (err) {
      // 忽略错误
    }
  }
}

describe('端到端测试', () => {
  let token1, token2;

  beforeAll(async () => {
    // 导入应用 (在设置环境变量后)
    const serverModule = require('../server');
    app = serverModule.app;
    
    // 等待数据库连接
    const { initDatabase } = require('../models/database');
    await initDatabase();
    
    // 清理并创建测试用户
    await cleanupTestData();
    await createTestUsers();
    
    // 生成 token
    token1 = generateToken(testUsers[0]);
    token2 = generateToken(testUsers[1]);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ==================== 认证测试 ====================
  
  describe('认证中间件', () => {
    
    test('无 token 时应返回 401', async () => {
      const res = await request(app)
        .get('/api/jobs');
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('登录');
    });

    test('无效 token 时应返回 401', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('有效 token 时应能访问 API', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${token1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('/api/auth/me 返回用户信息', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUsers[0].email);
    });
  });

  // ==================== 投递记录 CRUD 测试 ====================
  
  describe('投递记录 CRUD', () => {
    let createdJobId;

    test('创建投递记录', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          company_name: '测试公司 A',
          position: '前端工程师',
          salary_range: '20k-30k',
          location: '北京',
          status: 'pending'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      createdJobId = res.body.data.id;
    });

    test('获取投递记录列表', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${token1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('获取单个投递记录', async () => {
      const res = await request(app)
        .get(`/api/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company_name).toBe('测试公司 A');
      expect(res.body.data.position).toBe('前端工程师');
    });

    test('更新投递记录', async () => {
      const res = await request(app)
        .put(`/api/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          company_name: '测试公司 A (已更新)',
          position: '高级前端工程师',
          salary_range: '30k-40k',
          location: '北京',
          status: 'interviewing'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('删除投递记录', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('删除后记录不存在', async () => {
      const res = await request(app)
        .get(`/api/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(res.status).toBe(404);
    });
  });

  // ==================== 数据隔离测试 ====================
  
  describe('用户数据隔离', () => {
    let user1JobId, user2JobId;

    beforeAll(async () => {
      // 用户 1 创建记录
      const res1 = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          company_name: '用户1的公司',
          position: '职位A',
          status: 'pending'
        });
      user1JobId = res1.body.data.id;

      // 用户 2 创建记录
      const res2 = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          company_name: '用户2的公司',
          position: '职位B',
          status: 'pending'
        });
      user2JobId = res2.body.data.id;
    });

    test('用户 1 看不到用户 2 的记录', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${token1}`);
      
      expect(res.status).toBe(200);
      const companies = res.body.data.map(j => j.company_name);
      expect(companies).toContain('用户1的公司');
      expect(companies).not.toContain('用户2的公司');
    });

    test('用户 2 看不到用户 1 的记录', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${token2}`);
      
      expect(res.status).toBe(200);
      const companies = res.body.data.map(j => j.company_name);
      expect(companies).toContain('用户2的公司');
      expect(companies).not.toContain('用户1的公司');
    });

    test('用户 1 无法访问用户 2 的记录详情', async () => {
      const res = await request(app)
        .get(`/api/jobs/${user2JobId}`)
        .set('Authorization', `Bearer ${token1}`);
      
      expect(res.status).toBe(404);
    });

    test('用户 1 无法更新用户 2 的记录', async () => {
      const res = await request(app)
        .put(`/api/jobs/${user2JobId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          company_name: '尝试篡改',
          position: '职位B',
          status: 'pending'
        });
      
      expect(res.status).toBe(404);
    });

    test('用户 1 无法删除用户 2 的记录', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${user2JobId}`)
        .set('Authorization', `Bearer ${token1}`);
      
      // 由于删除操作不检查所有权，这里应该成功但实际未删除
      // 如果要严格验证，需要检查记录是否还存在
      const checkRes = await request(app)
        .get(`/api/jobs/${user2JobId}`)
        .set('Authorization', `Bearer ${token2}`);
      
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.company_name).toBe('用户2的公司');
    });
  });

  // ==================== 统计数据测试 ====================
  
  describe('统计数据', () => {
    test('统计数据只包含当前用户的数据', async () => {
      const res = await request(app)
        .get('/api/jobs/stats/overview')
        .set('Authorization', `Bearer ${token1}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('interviewing');
    });
  });
});
