import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth.js';

// One-time admin setup page — accessible at /setup
// Creates the first admin account + workspace. After that, admin logs in normally.
export default function SetupPage() {
  const navigate = useNavigate();
  const register = useRegister();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return triggerShake('Please enter your name');
    if (!email.trim()) return triggerShake('Please enter your email');
    if (password.length < 6) return triggerShake('Password must be at least 6 characters');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!workspaceName.trim()) return triggerShake('Workspace name is required');
    try {
      await register.mutateAsync({ name, email, password, workspaceName });
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      triggerShake(err.response?.data?.message || 'Setup failed. Please try again.');
    }
  };

  const isLoading = register.isPending;
  const isSuccess = register.isSuccess;

  return (
    <div className="login-page">
      {isSuccess ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, animation: 'fadeIn 0.3s ease' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(29,158,117,0.15)',
            border: '2px solid var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: 'var(--success)',
          }}>🚀</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Workspace ready!</div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>Redirecting to your dashboard...</div>
        </div>
      ) : (
        <div className={`login-card ${shake ? 'shake' : ''}`} style={{ maxWidth: 420 }}>
          {/* Logo */}
          <div className="login-logo-row" style={{ justifyContent: 'center', marginBottom: 6 }}>
            <div className="logo-mark" style={{ width: 36, height: 36, fontSize: 18, borderRadius: 9 }}>N</div>
            <div className="logo-text" style={{ fontSize: 16 }}>inquisitive<span>.</span>flow</div>
          </div>

          {/* Admin badge */}
          <div style={{
            background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.25)',
            borderRadius: 99, padding: '4px 14px', fontSize: 10,
            color: 'var(--yellow)', letterSpacing: '0.1em', textTransform: 'uppercase',
            textAlign: 'center', marginBottom: 22, display: 'block',
          }}>
            ⚙ Admin Setup — One Time
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 26 }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step >= s ? 'var(--yellow)' : 'var(--s2)',
                  border: step >= s ? 'none' : '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: step >= s ? 'var(--dark)' : 'var(--text-mute)',
                  transition: 'all 0.25s',
                }}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && (
                  <div style={{
                    width: 36, height: 2,
                    background: step > s ? 'var(--yellow)' : 'var(--border)',
                    borderRadius: 2, transition: 'background 0.25s',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Step 1: Admin account ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 4, letterSpacing: '-0.4px' }}>
                Create your admin account
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', marginBottom: 24 }}>
                You'll be the workspace owner and administrator
              </p>

              <form onSubmit={handleStep1}>
                <div style={{ marginBottom: 13 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Full Name</label>
                  <input type="text" className={`input ${error ? 'input-error' : ''}`}
                    placeholder="Your name" value={name}
                    onChange={e => { setName(e.target.value); setError(''); }}
                    autoFocus required style={{ padding: '11px 14px', fontSize: 14 }} />
                </div>

                <div style={{ marginBottom: 13 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Email</label>
                  <input type="email" className={`input ${error ? 'input-error' : ''}`}
                    placeholder="admin@company.io" value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    required style={{ padding: '11px 14px', fontSize: 14 }} />
                </div>

                <div style={{ marginBottom: 6 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'}
                      className={`input ${error ? 'input-error' : ''}`}
                      placeholder="Min. 6 characters" value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      required style={{ padding: '11px 42px 11px 14px', fontSize: 14 }} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', fontSize: 16, padding: 4, lineHeight: 1 }}>
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', margin: '8px 0', animation: 'fadeIn 0.15s ease' }}>
                    ⚠ {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg w-full"
                  style={{ borderRadius: 10, fontSize: 15, fontWeight: 700, padding: 13, justifyContent: 'center', marginTop: 18 }}>
                  Continue →
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Workspace ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 4, letterSpacing: '-0.4px' }}>
                Name your workspace
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', marginBottom: 24 }}>
                Your team will work together inside this workspace
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Workspace Name</label>
                  <input type="text" className={`input ${error ? 'input-error' : ''}`}
                    placeholder="Acme Corp, Dev Team..." value={workspaceName}
                    onChange={e => { setWorkspaceName(e.target.value); setError(''); }}
                    autoFocus required style={{ padding: '11px 14px', fontSize: 14 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 7, lineHeight: 1.5 }}>
                    After setup, go to <strong style={{ color: 'var(--text-sec)' }}>Members</strong> to add your team, then{' '}
                    <strong style={{ color: 'var(--text-sec)' }}>Settings</strong> for the invite link.
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', margin: '8px 0', animation: 'fadeIn 0.15s ease' }}>
                    ⚠ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ flex: '0 0 auto', borderRadius: 10, fontSize: 14, fontWeight: 600, padding: '13px 18px', background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--text-sec)', cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}
                    style={{ borderRadius: 10, fontSize: 15, fontWeight: 700, padding: 13, justifyContent: 'center' }}>
                    {isLoading ? (
                      <><div className="spinner" style={{ borderTopColor: 'var(--dark)', borderColor: 'rgba(20,20,20,0.3)' }} /> Creating...</>
                    ) : 'Launch Workspace 🚀'}
                  </button>
                </div>
              </form>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: 'var(--text-mute)' }}>
            Already set up?{' '}
            <Link to="/login" style={{ color: 'var(--yellow)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      )}
    </div>
  );
}
