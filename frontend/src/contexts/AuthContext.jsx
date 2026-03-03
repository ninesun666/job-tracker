/**
 * AuthContext - 认证上下文
 * 管理用户登录状态、token、用户信息
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// API 基础 URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// 请求拦截器 - 自动添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理 401
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 初始化：检查 token 有效性
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        // 开发模式：跳过后端验证
        if (import.meta.env.VITE_DEV_MODE === 'true') {
          try {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        } else {
          try {
            // 验证 token 是否有效
            const response = await api.get('/auth/me');
            if (response.data.success) {
              setUser(response.data.data);
              setToken(storedToken);
            } else {
              // token 无效
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (err) {
            console.error('Token validation failed:', err);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 登录成功后调用
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // 忽略错误
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // 更新用户信息
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUser,
    api, // 导出配置好的 axios 实例
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { api };
