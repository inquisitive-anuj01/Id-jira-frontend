import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth.js';
import { useWorkspaceStore } from '../stores/workspaceStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const setWorkspace = useWorkspaceStore(s => s.setWorkspace);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await login.mutateAsync({ email, password });
      if (data?.user?.workspace) setWorkspace(data.user.workspace);
      // Success state → fade out then navigate
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const isLoading = login.isPending;
  const isSuccess = login.isSuccess;

  return (
    <div className="login-page">
      {isSuccess ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, animation: 'fadeIn 0.3s ease' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(29,158,117,0.15)',
            border: '2px solid var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: 'var(--success)'
          }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Signed in!</div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>Redirecting to your workspace...</div>
        </div>
      ) : (
        <div ref={formRef} className={`login-card ${shake ? 'shake' : ''}`}>
          {/* Logo */}
          <div className="login-logo-row" style={{ justifyContent: 'center' }}>
            <div className="logo-mark" style={{ width: 36, height: 36, fontSize: 18, borderRadius: 9 }}>N</div>
            <div className="logo-text" style={{ fontSize: 16 }}>inquisitive<span>.</span>flow</div>
          </div>

          {/* Badge */}
          <div style={{
            background: 'var(--s2)', border: '1px solid var(--border)',
            borderRadius: 99, padding: '4px 14px',
            fontSize: 10, color: 'var(--text-sec)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            textAlign: 'center', marginBottom: 20, display: 'block'
          }}>
            ⚡ Your Work Dashboard
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: 'center', marginBottom: 4, letterSpacing: '-0.5px' }}>
            Welcome back.
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', marginBottom: 28 }}>
            Sign in to your workspace
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: 'var(--text-mute)', textTransform: 'uppercase',
                letterSpacing: '0.07em', marginBottom: 6,
                transition: 'color 0.15s'
              }}>Email</label>
              <input
                type="email"
                className={`input ${error ? 'input-error' : ''}`}
                placeholder="you@company.io"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
                required
                style={{ padding: '11px 14px', fontSize: 14 }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 6 }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 600,
                color: 'var(--text-mute)', textTransform: 'uppercase',
                letterSpacing: '0.07em', marginBottom: 6
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`input ${error ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  required
                  style={{ padding: '11px 42px 11px 14px', fontSize: 14 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-mute)', fontSize: 16, padding: 4,
                    transition: 'color 0.15s',
                    lineHeight: 1,
                  }}
                  title={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: 'var(--danger)', marginBottom: 8,
                animation: 'fadeIn 0.15s ease'
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: 'var(--text-mute)', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color = 'var(--yellow)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-mute)'}>
                Forgot password?
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isLoading}
              style={{ borderRadius: 10, fontSize: 15, fontWeight: 700, padding: 13, justifyContent: 'center' }}
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ borderTopColor: 'var(--dark)', borderColor: 'rgba(20,20,20,0.3)' }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Admin portal link — subtle, not for employees */}
          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-mute)' }}>
            Are you an Administrator?{' '}
            <Link to="/admin" style={{ color: 'var(--yellow)', fontWeight: 600, textDecoration: 'none' }}>
              Admin Portal →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
