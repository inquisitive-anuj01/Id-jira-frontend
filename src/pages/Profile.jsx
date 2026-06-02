import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useChangePassword } from '../hooks/useAuth.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Avatar from '../components/ui/Avatar.jsx';
import { RoleBadge } from '../components/ui/Badge.jsx';
import api from '../lib/api.js';

function PasswordStrength({ password }) {
  const strength = !password ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const colors = ['', 'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--success)'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return password ? (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= strength ? colors[strength] : 'var(--s3)', transition: 'all 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: colors[strength] }}>{labels[strength]}</span>
    </div>
  ) : null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const changePassword = useChangePassword();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const updateMe = useMutation({
    mutationFn: (data) => api.patch('/users/me', data).then(r => r.data.data.user),
    onSuccess: (updated) => {
      qc.setQueryData(['me'], updated);
      toast.success('Profile updated!');
    },
    onError: err => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    await updateMe.mutateAsync({ name, bio });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    await changePassword.mutateAsync({ currentPassword: currentPw, newPassword: newPw });
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  return (
    <div className="page-enter" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 2 }}>Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>Manage your personal information</p>
      </div>

      {/* Profile card */}
      <div className="settings-section">
        <form onSubmit={handleProfileSave}>
          {/* Avatar */}
          <div className="profile-avatar-row">
            <div style={{ position: 'relative', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.querySelector('.av-overlay').style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.querySelector('.av-overlay').style.opacity = '0'}
            >
              <Avatar user={user} size="2xl" />
              <div className="av-overlay" style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(244,199,26,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, opacity: 0, transition: 'opacity 0.2s',
              }}>📷</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{user?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RoleBadge role={user?.role} />
                <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>{user?.email}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="section-label">Full name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="section-label">Bio</label>
            <textarea className="input" value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell your team a bit about yourself..." rows={3} style={{ resize: 'none' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={updateMe.isPending}>
            {updateMe.isPending ? <span className="spinner-sm" /> : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="settings-section">
        <h3>Change Password</h3>
        <p className="sub">Use a strong password with at least 6 characters</p>
        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: 12 }}>
            <label className="section-label">Current password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="input"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', fontSize: 14 }}>
                {showCurrent ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="section-label">New password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                className="input"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                style={{ paddingRight: 40 }}
                placeholder="Min 6 characters"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', fontSize: 14 }}>
                {showNew ? '🙈' : '👁'}
              </button>
            </div>
            <PasswordStrength password={newPw} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="section-label">Confirm new password</label>
            <input
              type="password"
              className={`input ${confirmPw && confirmPw !== newPw ? 'input-error' : ''}`}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
            />
            {confirmPw && confirmPw !== newPw && (
              <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>Passwords do not match</div>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={changePassword.isPending || !currentPw || !newPw}>
            {changePassword.isPending ? <span className="spinner-sm" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
