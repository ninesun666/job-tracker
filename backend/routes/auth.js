/**
 * 认证路由 - GitHub OAuth
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { get, run } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'job-tracker-secret-key-change-in-production';
const JWT_EXPIRES = '7d';

// GitHub OAuth 配置
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * GET /api/auth/github
 * 重定向到 GitHub OAuth 授权页面
 */
router.get('/github', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: 'GitHub OAuth 未配置' });
  }

  const scope = 'user:email';
  const state = Math.random().toString(36).substring(7);
  
  // 存储 state 用于验证 (简单实现，生产环境应使用 session/redis)
  global.oauthStates = global.oauthStates || {};
  global.oauthStates[state] = { createdAt: Date.now() };

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=${scope}&state=${state}`;
  
  console.log(`[AUTH] GitHub OAuth redirect: ${githubAuthUrl}`);
  res.redirect(githubAuthUrl);
});

/**
 * GET /api/auth/github/callback
 * GitHub OAuth 回调处理 (旧路径兼容)
 */
router.get('/github/callback', async (req, res) => {
  // 重定向到新路径
  const { code, state, error, error_description } = req.query;
  let redirectUrl = `/api/login/githubCallBack?`;
  if (code) redirectUrl += `code=${code}&`;
  if (state) redirectUrl += `state=${state}&`;
  if (error) redirectUrl += `error=${error}&`;
  if (error_description) redirectUrl += `error_description=${encodeURIComponent(error_description)}`;
  res.redirect(redirectUrl);
});

/**
 * GET /api/login/githubCallBack
 * GitHub OAuth 回调处理
 */
router.get('/githubCallBack', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  // 处理授权错误
  if (error) {
    console.error(`[AUTH] GitHub OAuth error: ${error} - ${error_description}`);
    return res.redirect(`${CLIENT_URL}/login?error=${encodeURIComponent(error_description || error)}`);
  }

  // 验证 state
  if (!global.oauthStates?.[state]) {
    return res.redirect(`${CLIENT_URL}/login?error=invalid_state`);
  }
  delete global.oauthStates[state];

  if (!code) {
    return res.redirect(`${CLIENT_URL}/login?error=no_code`);
  }

  try {
    // 1. 用 code 换取 access_token
    console.log('[AUTH] Exchanging code for access token...');
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error('获取 access_token 失败');
    }

    // 2. 获取用户信息
    console.log('[AUTH] Fetching user info...');
    const [userResponse, emailsResponse] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ]);

    const githubUser = userResponse.data;
    const emails = emailsResponse.data;
    const primaryEmail = emails.find(e => e.primary && e.verified)?.email || emails[0]?.email;

    if (!primaryEmail) {
      throw new Error('未找到已验证的邮箱');
    }

    console.log(`[AUTH] GitHub user: ${githubUser.login} (${primaryEmail})`);

    // 3. 创建或更新用户
    let user = await get('SELECT * FROM users WHERE github_id = $1', [githubUser.id]);

    if (user) {
      // 更新用户
      await run(
        `UPDATE users SET 
          github_username = $1, name = $2, email = $3, avatar = $4, 
          last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5`,
        [githubUser.login, githubUser.name || githubUser.login, primaryEmail, githubUser.avatar_url, user.id]
      );
      user = await get('SELECT * FROM users WHERE id = $1', [user.id]);
      console.log(`[AUTH] User updated: ${user.email}`);
    } else {
      // 检查邮箱是否已存在
      user = await get('SELECT * FROM users WHERE email = $1', [primaryEmail]);
      
      if (user) {
        // 关联 GitHub 账号
        await run(
          `UPDATE users SET 
            github_id = $1, github_username = $2, avatar = $3, 
            provider = 'github', last_login = CURRENT_TIMESTAMP
          WHERE id = $4`,
          [githubUser.id, githubUser.login, githubUser.avatar_url, user.id]
        );
        user = await get('SELECT * FROM users WHERE id = $1', [user.id]);
        console.log(`[AUTH] GitHub linked to existing user: ${user.email}`);
      } else {
        // 创建新用户
        const result = await run(
          `INSERT INTO users (github_id, github_username, name, email, avatar, provider, last_login)
           VALUES ($1, $2, $3, $4, $5, 'github', CURRENT_TIMESTAMP)
           RETURNING id`,
          [githubUser.id, githubUser.login, githubUser.name || githubUser.login, primaryEmail, githubUser.avatar_url]
        );
        user = await get('SELECT * FROM users WHERE id = $1', [result.lastInsertRowid]);
        console.log(`[AUTH] New user created: ${user.email}`);
      }
    }

    // 4. 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, githubId: user.github_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // 5. 记录登录历史
    await run(
      `INSERT INTO login_history (user_id, email, provider, github_username, ip, user_agent, status)
       VALUES ($1, $2, 'github', $3, $4, $5, 'success')`,
      [user.id, user.email, user.github_username, req.ip, req.headers['user-agent']]
    );

    // 6. 重定向到前端
    console.log(`[AUTH] Login success, redirecting...`);
    res.redirect(`${CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      github_username: user.github_username
    }))}`);

  } catch (err) {
    console.error('[AUTH] GitHub OAuth error:', err.message);
    res.redirect(`${CLIENT_URL}/login?error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT id, github_id, github_username, name, email, avatar, provider, created_at FROM users WHERE id = $1', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
});

/**
 * POST /api/auth/logout
 * 登出（客户端清除 token）
 */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: '已登出' });
});

/**
 * GET /api/auth/status
 * 获取认证服务状态
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    github: {
      configured: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
      callbackUrl: GITHUB_CALLBACK_URL
    }
  });
});

module.exports = router;
