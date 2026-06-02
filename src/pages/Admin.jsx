import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin, useRegister } from '../hooks/useAuth.js';
import { useWorkspaceStore } from '../stores/workspaceStore.js';
import { toast } from 'react-toastify';

export default function AdminPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const register = useRegister();
  const setWorkspace = useWorkspaceStore(s => s.setWorkspace);

  // Modes: 'login' (admin sign in) or 'setup' (one-time register + create workspace)
  const [mode, setMode] = useState('login');
  
  // Setup steps: 1 (admin credentials), 2 (workspace details)
  const [setupStep, setSetupStep] = useState(1);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  // Handle Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await login.mutateAsync({ email, password });
      if (data?.user?.role !== 'admin') {
        toast.warning('Warning: You are logged in, but you are not an administrator.');
      } else {
        toast.success(`Welcome back, Admin ${data.user.name}!`);
      }
      if (data?.user?.workspace) setWorkspace(data.user.workspace);
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      triggerShake(err.response?.data?.message || 'Invalid admin credentials');
    }
  };

  // Setup Step 1 Validation
  const handleSetupStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return triggerShake('Please enter your name');
    if (!email.trim()) return triggerShake('Please enter your email');
    if (password.length < 6) return triggerShake('Password must be at least 6 characters');
    setSetupStep(2);
  };

  // Setup Final Submit
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!workspaceName.trim()) return triggerShake('Workspace name is required');
    try {
      const data = await register.mutateAsync({ name, email, password, workspaceName });
      toast.success('Workspace created successfully!');
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      triggerShake(err.response?.data?.message || 'Setup failed. Please try again.');
    }
  };

  const isLoading = login.isPending || register.isPending;

  return (
    <div className="login-page">
      <div className={`login-card ${shake ? 'shake' : ''}`} style={{ maxWidth: 420 }}>
        {/* Logo */}
        <div className="login-logo-row" style={{ justifyContent: 'center', marginBottom: 6 }}>
          <div className="logo-mark" style={{ width: 36, height: 36, fontSize: 18, borderRadius: 9 }}>N</div>
          <div className="logo-text" style={{ fontSize: 16 }}>inquisitive<span>.</span>flow</div>
        </div>

        {/* Admin identifier badge */}
        <div style={{
          background: 'rgba(244, 199, 26, 0.08)',
          border: '1px solid rgba(244, 199, 26, 0.25)',
          borderRadius: 99, padding: '4px 14px', fontSize: 10,
          color: 'var(--yellow)', letterSpacing: '0.12em', textTransform: 'uppercase',
          textAlign: 'center', marginBottom: 22, display: 'block',
          fontWeight: 700
        }}>
          🛡 Admin Portal {mode === 'setup' ? '— Workspace Creator' : '— Secure Login'}
        </div>

        {/* ──────── MODE: ADMIN LOGIN ──────── */}
        {mode === 'login' && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 4, letterSpacing: '-0.4px' }}>
              Administrator Sign In
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', marginBottom: 24 }}>
              Access your workspace management dashboard
            </p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 13 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Admin Email</label>
                <input
                  type="email"
                  className={`input ${error ? 'input-error' : ''}`}
                  placeholder="admin@company.io"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required
                  autoFocus
                  style={{ padding: '11px 14px', fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 6 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`input ${error ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    required
                    style={{ padding: '11px 42px 11px 14px', fontSize: 14 }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', fontSize: 16, padding: 4, lineHeight: 1 }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', margin: '12px 0', animation: 'fadeIn 0.15s ease' }}>
                  ⚠ {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}
                style={{ borderRadius: 10, fontSize: 15, fontWeight: 700, padding: 13, justifyContent: 'center', marginTop: 18 }}>
                {isLoading ? (
                  <><div className="spinner" style={{ borderTopColor: 'var(--dark)', borderColor: 'rgba(20,20,20,0.3)' }} /> Signing in...</>
                ) : 'Sign In as Admin 🛡'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: 'var(--text-mute)' }}>
              First time setup?{' '}
              <button
                type="button"
                onClick={() => { setMode('setup'); setSetupStep(1); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Create Workspace & Admin Account →
              </button>
            </div>
          </>
        )}

        {/* ──────── MODE: ADMIN SETUP (ONE-TIME) ──────── */}
        {mode === 'setup' && (
          <>
            {/* Step Dots */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: setupStep >= s ? 'var(--yellow)' : 'var(--s2)',
                    border: setupStep >= s ? 'none' : '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: setupStep >= s ? 'var(--dark)' : 'var(--text-mute)',
                    transition: 'all 0.25s',
                  }}>
                    {setupStep > s ? '✓' : s}
                  </div>
                  {s < 2 && (
                    <div style={{
                      width: 32, height: 2,
                      background: setupStep > s ? 'var(--yellow)' : 'var(--border)',
                      borderRadius: 2, transition: 'background 0.25s',
                    }} />
                  )}
                </div>
              ))}
            </div>

            {setupStep === 1 ? (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 4, letterSpacing: '-0.4px' }}>
                  Create Admin Account
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', marginBottom: 20 }}>
                  You will be the owner and main administrator
                </p>

                <form onSubmit={handleSetupStep1}>
                  <div style={{ marginBottom: 13 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Full Name</label>
                    <input type="text" className={`input ${error ? 'input-error' : ''}`}
                      placeholder="Your name" value={name}
                      onChange={e => { setName(e.target.value); setError(''); }}
                      autoFocus required style={{ padding: '10px 12px', fontSize: 13 }} />
                  </div>

                  <div style={{ marginBottom: 13 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Email Address</label>
                    <input type="email" className={`input ${error ? 'input-error' : ''}`}
                      placeholder="admin@company.io" value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      required style={{ padding: '10px 12px', fontSize: 13 }} />
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPw ? 'text' : 'password'}
                        className={`input ${error ? 'input-error' : ''}`}
                        placeholder="Min. 6 characters" value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        required style={{ padding: '10px 42px 10px 12px', fontSize: 13 }} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', fontSize: 16, padding: 4, lineHeight: 1 }}>
                        {showPw ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', margin: '10px 0', animation: 'fadeIn 0.15s ease' }}>
                      ⚠ {error}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-md w-full"
                    style={{ borderRadius: 10, fontSize: 14, fontWeight: 700, padding: 12, justifyContent: 'center', marginTop: 18 }}>
                    Continue →
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 4, letterSpacing: '-0.4px' }}>
                  Name your workspace
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', marginBottom: 20 }}>
                  This is the collective space for your entire team
                </p>

                <form onSubmit={handleSetupSubmit}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Workspace Name</label>
                    <input type="text" className={`input ${error ? 'input-error' : ''}`}
                      placeholder="Acme Corp, Dev Team..." value={workspaceName}
                      onChange={e => { setWorkspaceName(e.target.value); setError(''); }}
                      autoFocus required style={{ padding: '10px 12px', fontSize: 13 }} />
                    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 8, lineHeight: 1.5 }}>
                      After launching, you will be taken to your dashboard. Go to the <strong style={{ color: 'var(--text-sec)' }}>Members</strong> page to directly create employee accounts.
                    </div>
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', margin: '10px 0', animation: 'fadeIn 0.15s ease' }}>
                      ⚠ {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <button type="button" onClick={() => setSetupStep(1)}
                      style={{ flex: '0 0 auto', borderRadius: 10, fontSize: 13, fontWeight: 600, padding: '10px 14px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text-sec)', cursor: 'pointer' }}>
                      ← Back
                    </button>
                    <button type="submit" className="btn btn-primary btn-md w-full" disabled={isLoading}
                      style={{ borderRadius: 10, fontSize: 14, fontWeight: 700, padding: 12, justifyContent: 'center' }}>
                      {isLoading ? (
                        <><div className="spinner" style={{ borderTopColor: 'var(--dark)', borderColor: 'rgba(20,20,20,0.3)' }} /> Creating...</>
                      ) : 'Launch Workspace 🚀'}
                    </button>
                  </div>
                </form>
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: 'var(--text-mute)' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Sign In as Admin
              </button>
            </div>
          </>
        )}

        {/* Subtle footer */}
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-mute)' }}>
          Regular Employee?{' '}
          <Link to="/login" style={{ color: 'var(--text-sec)', fontWeight: 600, textDecoration: 'none' }}>
            Go to Employee Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
