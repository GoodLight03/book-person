import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Login.css';

export default function Login() {
  const { login, register, error, clearError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLightOn, setIsLightOn] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePull = () => {
    if (isPulling) return;
    setIsPulling(true);
    setTimeout(() => {
      setIsLightOn((p) => !p);
      setIsPulling(false);
      if (isLightOn) clearError();
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, displayName.trim() || undefined);
      }
    } catch {
      // error set in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-room ${isLightOn ? 'light-on' : 'light-off'}`}>
      <button className="theme-fab" onClick={toggleTheme} title="Đổi giao diện">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="ceiling" />

      <div className="light-fixture">
        <div className="wire" />
        <div className={`bulb-wrapper ${isLightOn ? 'on' : ''}`}>
          <div className="bulb">
            <div className="filament" />
            <div className="glow" />
          </div>
          <div className="socket" />
        </div>
        <div className={`pull-cord ${isPulling ? 'pulling' : ''}`} onClick={handlePull} title="Kéo dây đèn">
          <div className="cord-line" />
          <div className="cord-handle" />
        </div>
      </div>

      {!isLightOn && (
        <div className="hint">
          <p>💡 Kéo dây đèn để bắt đầu</p>
        </div>
      )}

      <div className={`login-form-container ${isLightOn ? 'visible' : ''}`}>
        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Self Talk Book</h1>
          <p className="subtitle">Cuốn sách tự nói chuyện với bản thân</p>

          <div className="tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); clearError(); }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => { setMode('register'); clearError(); }}
            >
              Đăng ký
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {mode === 'register' && (
            <div className="field">
              <label htmlFor="displayName">Tên hiển thị</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tên của bạn"
                disabled={loading}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="username">Tài khoản</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>

      {isLightOn && <div className="floor-glow" />}
    </div>
  );
}
