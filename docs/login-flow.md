# 登录流程文档

## 概述

本项目使用 **GitHub OAuth 2.0** 进行用户认证，登录流程涉及前端、后端、GitHub OAuth 服务三方交互。

---

## 流程图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              GitHub OAuth 登录流程                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  用户    │      │  前端    │      │  后端    │      │  GitHub  │      │  数据库  │
│ (浏览器) │      │ (React)  │      │ (Node)   │      │  OAuth   │      │(PostgreSQL)│
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │                 │
     │  1. 点击登录    │                 │                 │                 │
     ├────────────────>│                 │                 │                 │
     │                 │                 │                 │                 │
     │                 │  2. 重定向到 /api/auth/github    │                 │
     │                 ├────────────────>│                 │                 │
     │                 │                 │                 │                 │
     │                 │                 │  3. 生成 state  │                 │
     │                 │                 │  存储 state     │                 │
     │                 │                 ├─────────────────────────────────>│
     │                 │                 │                 │                 │
     │  4. 302 重定向到 GitHub 授权页面 │                 │                 │
     │<────────────────┼─────────────────┤                 │                 │
     │                 │                 │                 │                 │
     │  5. 用户授权 (同意/拒绝)          │                 │                 │
     ├────────────────────────────────────────────────────>│                 │
     │                 │                 │                 │                 │
     │  6. 回调带 code & state          │                 │                 │
     │<────────────────────────────────────────────────────┤                 │
     │                 │                 │                 │                 │
     │  7. 请求 /api/login/githubCallBack?code=xxx&state=xxx               │
     ├─────────────────────────────────>│                 │                 │
     │                 │                 │                 │                 │
     │                 │                 │  8. 验证 state  │                 │
     │                 │                 ├─────────────────────────────────>│
     │                 │                 │                 │                 │
     │                 │                 │  9. 用 code 换 access_token      │
     │                 │                 ├────────────────>│                 │
     │                 │                 │                 │                 │
     │                 │                 │  10. 返回 access_token           │
     │                 │                 │<────────────────┤                 │
     │                 │                 │                 │                 │
     │                 │                 │  11. 获取用户信息 & 邮箱          │
     │                 │                 ├────────────────>│                 │
     │                 │                 │                 │                 │
     │                 │                 │  12. 返回用户信息                 │
     │                 │                 │<────────────────┤                 │
     │                 │                 │                 │                 │
     │                 │                 │  13. 创建/更新用户                │
     │                 │                 ├─────────────────────────────────>│
     │                 │                 │                 │                 │
     │                 │                 │  14. 生成 JWT   │                 │
     │                 │                 │                 │                 │
     │                 │                 │  15. 记录登录历史                 │
     │                 │                 ├─────────────────────────────────>│
     │                 │                 │                 │                 │
     │  16. 重定向到前端 /auth/callback?token=xxx&user=xxx                  │
     │<────────────────┼─────────────────┤                 │                 │
     │                 │                 │                 │                 │
     │                 │  17. 解析 token & user            │                 │
     │                 │  18. 存储到 localStorage          │                 │
     │                 │  19. 更新 AuthContext             │                 │
     │                 │  20. 跳转到首页 /                  │                 │
     │                 │                 │                 │                 │
     │  21. 显示首页   │                 │                 │                 │
     │<────────────────┤                 │                 │                 │
     │                 │                 │                 │                 │
     ▼                 ▼                 ▼                 ▼                 ▼
```

---

## 涉及文件

### 前端文件

| 文件 | 路径 | 职责 |
|------|------|------|
| **Login.jsx** | `frontend/src/pages/Login.jsx` | 登录页面，显示 GitHub 登录按钮，点击后跳转到后端 OAuth 入口 |
| **AuthCallback.jsx** | `frontend/src/pages/AuthCallback.jsx` | OAuth 回调页面，解析 URL 中的 token 和用户信息，存储到本地 |
| **AuthContext.jsx** | `frontend/src/contexts/AuthContext.jsx` | 认证上下文，管理 token、用户状态，提供 login/logout 方法 |
| **App.jsx** | `frontend/src/App.jsx` | 路由配置，保护需登录的路由 |

### 后端文件

| 文件 | 路径 | 职责 |
|------|------|------|
| **auth.js** | `backend/routes/auth.js` | OAuth 路由处理，包括重定向、回调、token 生成 |
| **database.js** | `backend/models/database.js` | 数据库操作，用户 CRUD |

### 数据库表

| 表名 | 用途 |
|------|------|
| **users** | 存储用户信息 (github_id, email, name, avatar 等) |
| **login_history** | 记录登录历史 |

---

## 详细步骤说明

### 步骤 1-2: 用户点击登录

**文件**: `frontend/src/pages/Login.jsx:26-28`

```jsx
const handleGitHubLogin = () => {
  window.location.href = `${API_URL}/auth/github`;
};
```

用户点击"使用 GitHub 登录"按钮，浏览器跳转到后端 `/api/auth/github`。

---

### 步骤 3-4: 后端重定向到 GitHub

**文件**: `backend/routes/auth.js:24-37`

```javascript
router.get('/github', (req, res) => {
  // 生成随机 state 防止 CSRF
  const state = Math.random().toString(36).substring(7);
  global.oauthStates[state] = { createdAt: Date.now() };

  // 构造 GitHub 授权 URL
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&scope=user:email&state=${state}`;
  
  res.redirect(githubAuthUrl);
});
```

后端生成随机 `state` 参数，然后重定向到 GitHub 授权页面。

---

### 步骤 5-6: 用户授权 & GitHub 回调

用户在 GitHub 页面选择"同意"或"拒绝"。同意后 GitHub 重定向回应用：

```
/api/login/githubCallBack?code=xxx&state=xxx
```

---

### 步骤 7-12: 后端处理回调

**文件**: `backend/routes/auth.js:54-98`

```javascript
router.get('/githubCallBack', async (req, res) => {
  const { code, state } = req.query;

  // 1. 验证 state
  if (!global.oauthStates?.[state]) {
    return res.redirect(`${CLIENT_URL}/login?error=invalid_state`);
  }

  // 2. 用 code 换 access_token
  const tokenResponse = await axios.post(
    'https://github.com/login/oauth/access_token',
    { client_id, client_secret, code }
  );

  // 3. 获取用户信息和邮箱
  const [userResponse, emailsResponse] = await Promise.all([
    axios.get('https://api.github.com/user', { headers: { Authorization: `Bearer ${accessToken}` }}),
    axios.get('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${accessToken}` }})
  ]);
});
```

---

### 步骤 13-15: 创建/更新用户 & 生成 JWT

**文件**: `backend/routes/auth.js:100-135`

```javascript
// 查找或创建用户
let user = await get('SELECT * FROM users WHERE github_id = $1', [githubUser.id]);

if (!user) {
  // 创建新用户
  await run(`INSERT INTO users ...`);
}

// 生成 JWT (有效期 7 天)
const token = jwt.sign(
  { userId: user.id, email: user.email },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// 记录登录历史
await run(`INSERT INTO login_history ...`);
```

---

### 步骤 16: 重定向到前端

```javascript
res.redirect(`${CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
```

---

### 步骤 17-20: 前端处理回调

**文件**: `frontend/src/pages/AuthCallback.jsx:13-23`

```javascript
useEffect(() => {
  const token = searchParams.get('token');
  const userStr = searchParams.get('user');

  if (token && userStr) {
    const user = JSON.parse(decodeURIComponent(userStr));
    login(token, user);  // 存储到 localStorage
    navigate('/');       // 跳转首页
  }
}, [searchParams, login, navigate]);
```

---

### 步骤 18-19: 存储认证信息

**文件**: `frontend/src/contexts/AuthContext.jsx:64-69`

```javascript
const login = useCallback((newToken, newUser) => {
  localStorage.setItem('token', newToken);
  localStorage.setItem('user', JSON.stringify(newUser));
  setToken(newToken);
  setUser(newUser);
}, []);
```

---

## 认证状态管理

### AuthContext 提供的能力

```javascript
const { 
  user,           // 当前用户信息
  token,          // JWT token
  loading,        // 加载状态
  isAuthenticated, // 是否已登录
  login,          // 登录方法
  logout,         // 登出方法
  updateUser,     // 更新用户信息
  api             // 配置好的 axios 实例 (自动携带 token)
} = useAuth();
```

### Token 自动刷新

每次请求自动携带 token：

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

401 时自动登出：

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 环境变量配置

### 后端 (.env)

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/login/githubCallBack
CLIENT_URL=http://localhost:3000

# JWT
JWT_SECRET=your_jwt_secret
```

### 前端 (.env.development)

```bash
VITE_API_URL=http://localhost:3001/api
VITE_DEV_MODE=true
```

---

## 安全考虑

1. **State 参数**: 防止 CSRF 攻击
2. **JWT 有效期**: 7 天，可配置
3. **Token 存储**: localStorage (XSS 风险，可考虑 HttpOnly Cookie)
4. **HTTPS**: 生产环境必须使用 HTTPS

---

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `invalid_state` | State 验证失败 | 重定向到登录页显示错误 |
| `no_code` | GitHub 未返回 code | 重定向到登录页显示错误 |
| `access_token 失败` | code 过期或无效 | 重定向到登录页显示错误 |
| `未找到邮箱` | GitHub 账号无公开邮箱 | 重定向到登录页显示错误 |
