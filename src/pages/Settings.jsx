import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useWorkspace, useUpdateWorkspace, useResetInvite } from '../hooks/useWorkspace.js';
import { useUIStore } from '../stores/uiStore.js';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../lib/api.js';

export default function SettingsPage() {
  const { user } = useAuth();
  const openConfirm = useUIStore(s => s.openConfirmDialog);
  const workspaceId = user?.workspaceId?._id || user?.workspaceId;
  const { data: workspace } = useWorkspace(workspaceId);
  const updateWorkspace = useUpdateWorkspace(workspaceId);
  const resetInvite = useResetInvite(workspaceId);

  const [wsName, setWsName] = useState(workspace?.name || '');
  const [copied, setCopied] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (workspace?.name) {
      setWsName(workspace.name);
    }
  }, [workspace?.name]);

  const inviteUrl = workspace?.inviteToken
    ? `${window.location.origin}/join/${workspace.inviteToken}`
    : '';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    await updateWorkspace.mutateAsync({ name: wsName.trim() });
    toast.success('Workspace saved!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteWorkspace = useMutation({
    mutationFn: () => api.delete(`/workspaces/${workspaceId}`),
    onSuccess: () => {
      toast.success('Workspace deleted.');
      window.location.href = '/login';
    },
    onError: err => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div className="page-enter" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 2 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>Manage your workspace configuration</p>
      </div>

      {/* Workspace Info */}
      <div className="settings-section">
        <h3>Workspace info</h3>
        <p className="sub">Update your workspace name and icon</p>
        <form onSubmit={handleSave}>
          <label className="section-label">Workspace name</label>
          <input
            className="input"
            value={wsName}
            onChange={e => setWsName(e.target.value)}
            style={{ marginBottom: 12 }}
            disabled={!isAdmin}
          />
          {/* Upload zone */}
          <div
            style={{
              border: '1px dashed var(--border)', borderRadius: 10,
              padding: 18, textAlign: 'center', cursor: 'pointer',
              marginBottom: 14, transition: 'var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--yellow)'; e.currentTarget.style.background = 'rgba(244,199,26,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ fontSize: 22, color: 'var(--text-mute)', marginBottom: 4 }}>☁</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>Upload workspace icon — JPG, PNG, SVG, max 1MB</div>
          </div>
          {isAdmin && (
            <button type="submit" className="btn btn-primary btn-sm" disabled={updateWorkspace.isPending}>
              {updateWorkspace.isPending ? <span className="spinner-sm" /> : '✓ Save changes'}
            </button>
          )}
        </form>
      </div>

      {/* Invite Members */}
      <div className="settings-section">
        <h3>Invite members</h3>
        <p className="sub">Share this link to invite people to your workspace</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            className="input"
            value={inviteUrl}
            readOnly
            style={{ fontSize: 11, color: 'var(--text-mute)', flex: 1 }}
          />
          <button
            className="btn btn-outline btn-sm"
            onClick={handleCopy}
            style={{
              whiteSpace: 'nowrap', flexShrink: 0,
              ...(copied ? { borderColor: 'var(--success)', color: 'var(--success)' } : {})
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        {isAdmin && (
          <button className="btn btn-outline btn-sm" onClick={() => resetInvite.mutate()} disabled={resetInvite.isPending}>
            {resetInvite.isPending ? <span className="spinner-sm" /> : '↻ Reset invite link'}
          </button>
        )}
      </div>

      {/* Danger Zone */}
      {isAdmin && (
        <div className="settings-section danger-zone">
          <h3 style={{ color: 'var(--danger)' }}>Danger zone</h3>
          <p className="sub">Deleting a workspace is irreversible and removes all data</p>

          {!showDeleteConfirm ? (
            <button className="btn btn-outline-danger btn-sm" onClick={() => setShowDeleteConfirm(true)}>
              🗑 Delete workspace
            </button>
          ) : (
            <div style={{ marginTop: 12, padding: 16, background: 'rgba(226,75,74,0.05)', border: '1px solid rgba(226,75,74,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Delete workspace?</div>
              <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 12 }}>
                Type <strong style={{ color: 'var(--text)' }}>{workspace?.name}</strong> to confirm. This cannot be undone.
              </div>
              <input
                className="input"
                placeholder="Type workspace name..."
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                style={{ marginBottom: 12, borderColor: 'rgba(226,75,74,0.4)' }}
                autoComplete="off"
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}>Cancel</button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  disabled={deleteInput !== workspace?.name || deleteWorkspace.isPending}
                  onClick={() => deleteWorkspace.mutate()}
                >
                  {deleteWorkspace.isPending ? <span className="spinner-sm" /> : '🗑 Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
