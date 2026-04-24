import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Bell, Eye, EyeOff } from 'lucide-react';
import { firebaseAuth } from '../firebase';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      navigate('/');
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setError('Invalid email or password. Please try again.');
            break;
          case 'auth/invalid-email':
            setError('Enter a valid email address.');
            break;
          case 'auth/too-many-requests':
            setError('Too many attempts. Try again later.');
            break;
          default:
            setError(err.message);
        }
      } else {
        setError('Sign in failed. Check your Firebase configuration and try again.');
      }
    } finally {
      setIsSubmitting(false);
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
        <div className="login-sub uppercase tracking-[0.1em]">Sign in with your Firebase account</div>

        {error && (
          <div className="login-err animate-in slide-in-from-top-2">
            {error}
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

          <button type="submit" className="login-btn font-mono uppercase tracking-widest mt-4" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="login-footer uppercase tracking-[0.2em] opacity-40">
          Notivo &bull; Firebase Auth &bull; Secure
        </div>
      </div>
    </div>
  );
}
