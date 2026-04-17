import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Eye, EyeOff } from 'lucide-react';

export function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Using Master Credentials from prototype
    if (email === 'admin@notivo.edu' && password === 'Notivo@2026') {
      setError(false);
      localStorage.setItem('notivo_auth', 'true');
      onLogin();
      navigate('/');
    } else {
      setError(true);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-bg"></div>
      <div className="login-card animate-in zoom-in duration-500">
        <div className="login-brand">
          <div className="login-brand-ic">
            <Bell size={24} />
          </div>
          <div>
            <div className="login-brand-name uppercase">Notivo</div>
            <div className="login-brand-sub">Admin Portal</div>
          </div>
        </div>

        <div className="login-title font-serif tracking-tight">Welcome Back</div>
        <div className="login-sub uppercase tracking-[0.1em]">Sign in with master credentials</div>

        {error && (
          <div className="login-err animate-in slide-in-from-top-2">
            Invalid email or password. Please try again.
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label className="login-label">Email Address</label>
            <input 
              type="email" 
              className="login-input" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-pwd-wrap">
              <input 
                type={showPassword ? "text" : "password"} 
                className="login-input" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="login-eye" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn font-mono uppercase tracking-widest mt-4">
            Sign In to Dashboard
          </button>
        </form>

        <div className="login-footer uppercase tracking-[0.2em] opacity-40">
          Notivo &bull; Master Access &bull; Secure
        </div>
      </div>
    </div>
  );
}
