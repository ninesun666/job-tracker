/**
 * 登录页面 - GitHub OAuth
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GithubIcon } from '../components/Icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Login() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  // 已登录则跳转首页
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGitHubLogin = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745" />
              <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <rect x="3" y="6" width="18" height="14" rx="2" />
              <path d="M3 10h18" />
            </svg>
          </div>
          <h1 className="login-title">面试投递记录</h1>
          <p className="login-subtitle">追踪你的求职进度，让每一步都有迹可循</p>
        </div>

        {error && (
          <div className="login-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{decodeURIComponent(error)}</span>
          </div>
        )}

        <button className="login-btn github" onClick={handleGitHubLogin}>
          <GithubIcon size="sm" />
          <span>使用 GitHub 登录</span>
        </button>

        <div className="login-footer">
          <p>登录即表示你同意我们的服务条款和隐私政策</p>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .login-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: white;
        }

        .login-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary, #1a1a2e);
          margin: 0 0 8px;
        }

        .login-subtitle {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
          margin: 0;
        }

        .login-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #dc2626;
          font-size: 14px;
        }

        .login-btn {
          width: 100%;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          border: none;
        }

        .login-btn.github {
          background: #24292e;
          color: white;
        }

        .login-btn.github:hover {
          background: #1a1e22;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .login-footer {
          margin-top: 24px;
          text-align: center;
        }

        .login-footer p {
          font-size: 12px;
          color: var(--text-tertiary, #9ca3af);
          margin: 0;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 24px;
          }

          .login-title {
            font-size: 20px;
          }

          .login-logo {
            width: 64px;
            height: 64px;
          }
        }
      `}</style>
    </div>
  );
}
