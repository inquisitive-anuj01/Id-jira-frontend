import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api, { saveToken } from '../lib/api.js';
import { useWorkspaceStore } from '../stores/workspaceStore.js';
import { toast } from 'react-toastify';

// Employees land here via invite link: /join/:inviteToken
// They fill in name + email + password to create their account and join the workspace.
export default function JoinPage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setWorkspace = useWorkspaceStore(s => s.setWorkspace);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [joined, setJoined] = useState(false);

  const triggerShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const join = useMutation({
    mutationFn: (payload) =>
      api.post(`/auth/join/${inviteToken}`, payload).then(r => r.data.data),
    onSuccess: (data) => {
      setJoined(true);
      if (data.token) saveToken(data.token);
      qc.setQueryData(['me'], data.user);
      if (data.workspace) setWorkspace(data.workspace);
      toast.success(`Welcome! You've joined ${data.workspace?.name || 'the workspace'}`);
      setTimeout(() => navigate('/'), 1500);
    },
    onError: (err) => {
      triggerShake(err.response?.data?.message || 'Invalid or expired invite link');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return triggerShake('Please enter your name');
    if (!email.trim()) return triggerShake('Please enter your email');
    if (password.length < 6) return triggerShake('Password must be at least 6 characters');
    join.mutate({ name, email, password });
  };

  return (
    <div className="login-page">
      <div className={`login-card ${shake ? 'shake' : ''}`} style={{ maxWidth: 420 }}>
        {/* Logo */}
        <div className="login-logo-row" style={{ justifyContent: 'center', marginBottom: 6 }}>
          <div className="logo-mark" style={{ width: 36, height: 36, fontSize: 18, borderRadius: 9 }}>N</div>
          <div className="logo-text" style={{ fontSize: 16 }}>inquisitive<span>.</span>flow</div>
        </div>

        {/* Invite badge */}
        <div style={{
          background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.25)',
          borderRadius: 99, padding: '4px 14px', fontSize: 10,
          color: 'var(--yellow)', letterSpacing: '0.1em', textTransform: 'uppercase',
          textAlign: 'center', marginBottom: 22, display: 'block',
        }}>
          📩 Workspace Invite
        </div>

        {joined ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '20px 0', animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(29,158,117,0.15)',
              border: '2px solid var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>You're in!</div>
            <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>Redirecting to your workspace...</div>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 4, letterSpacing: '-0.4px' }}>
              Join the workspace
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-mute)', textAlign: 'center', marginBottom: 26 }}>
              Create your account to accept this invite
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 13 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className={`input ${error ? 'input-error' : ''}`}
                  placeholder="Your name"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  autoFocus
                  required
                  style={{ padding: '11px 14px', fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 13 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Work Email
                </label>
                <input
                  type="email"
                  className={`input ${error ? 'input-error' : ''}`}
                  placeholder="you@company.io"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  required
                  style={{ padding: '11px 14px', fontSize: 14 }}
                />
              </div>

              <div style={{ marginBottom: 6 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Choose a Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`input ${error ? 'input-error' : ''}`}
                    placeholder="Min. 6 characters"
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', margin: '10px 0', animation: 'fadeIn 0.15s ease' }}>
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={join.isPending}
                style={{ borderRadius: 10, fontSize: 15, fontWeight: 700, padding: 13, justifyContent: 'center', marginTop: 18 }}
              >
                {join.isPending ? (
                  <><div className="spinner" style={{ borderTopColor: 'var(--dark)', borderColor: 'rgba(20,20,20,0.3)' }} /> Joining...</>
                ) : 'Accept Invite & Join 🚀'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-mute)' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: 'var(--yellow)', fontWeight: 600, textDecoration: 'none' }}>Sign in</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
