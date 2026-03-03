/**
 * OAuth 回调页面 - 处理 GitHub 登录回调
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(token, user);
        navigate('/');
      } catch (err) {
        console.error('Failed to parse user data:', err);
        setError('登录失败：数据解析错误');
      }
    } else {
      setError('登录失败：未收到授权信息');
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="callback-page">
      <div className="callback-card">
        {error ? (
          <>
            <div className="callback-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>登录失败</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/login')}>返回登录</button>
          </>
        ) : (
          <>
            <div className="callback-spinner"></div>
            <h2>正在登录...</h2>
            <p>请稍候，我们正在处理你的登录请求</p>
          </>
        )}
      </div>

      <style>{`
        .callback-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .callback-card {
          background: white;
          border-radius: 16px;
          padding: 48px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .callback-card h2 {
          margin: 20px 0 8px;
          color: var(--text-primary, #1a1a2e);
        }

        .callback-card p {
          color: var(--text-secondary, #6b7280);
          margin: 0;
        }

        .callback-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .callback-error {
          color: #dc2626;
        }

        .callback-card button {
          margin-top: 20px;
          padding: 10px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .callback-card button:hover {
          background: #5a67d8;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
