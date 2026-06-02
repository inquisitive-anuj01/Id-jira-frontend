import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useWorkspaceMembers, useUpdateMemberPermissions, useRemoveMember, useCreateMember } from '../hooks/useWorkspace.js';
import { useUIStore } from '../stores/uiStore.js';
import Avatar from '../components/ui/Avatar.jsx';
import { RoleBadge } from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';

const ALL_PERMISSIONS = [
  { key: 'create_project',      label: 'Create projects' },
  { key: 'edit_project',        label: 'Edit projects' },
  { key: 'delete_project',      label: 'Delete projects' },
  { key: 'create_task',         label: 'Create tasks' },
  { key: 'edit_task',           label: 'Edit tasks' },
  { key: 'delete_task',         label: 'Delete tasks' },
  { key: 'assign_task',         label: 'Assign tasks' },
  { key: 'change_task_status',  label: 'Change task status' },
  { key: 'comment',             label: 'Comment on tasks' },
  { key: 'manage_members_view', label: 'View members list' },
  { key: 'manage_permissions',  label: 'Manage permissions' },
  { key: 'manage_workspace',    label: 'Manage workspace' },
];

function PermissionsModal({ member, workspaceId, onClose }) {
  const updatePerms = useUpdateMemberPermissions(workspaceId);
  const [perms, setPerms] = useState(member.permissions || []);
  const [role, setRole] = useState(member.role || 'employee');

  const toggle = (key) => {
    setPerms(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key]);
  };

  const handleSave = async () => {
    await updatePerms.mutateAsync({ userId: member.userId._id, permissions: perms, role });
    onClose();
  };

  return (
    <div style={{ padding: 24, width: 420 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Avatar user={member.userId} size="md" />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{member.userId?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{member.userId?.email}</div>
        </div>
        <select className="input" value={role} onChange={e => setRole(e.target.value)}
          style={{ marginLeft: 'auto', width: 120, padding: '5px 10px', fontSize: 12 }}>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 8 }}>Permissions</div>
        {ALL_PERMISSIONS.map(perm => (
          <div key={perm.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--s2)', fontSize: 13, color: 'var(--text-sec)' }}>
            <span>{perm.label}</span>
            {/* Toggle switch */}
            <label style={{ position: 'relative', width: 34, height: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={perms.includes(perm.key)} onChange={() => toggle(perm.key)}
                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
              <span style={{
                position: 'absolute', inset: 0,
                background: perms.includes(perm.key) ? 'rgba(244,199,26,0.2)' : 'var(--s2)',
                borderRadius: 99,
                border: perms.includes(perm.key) ? '1px solid var(--yellow)' : '1px solid var(--border)',
                transition: 'all 0.2s',
              }}>
                <span style={{
                  position: 'absolute',
                  width: 14, height: 14,
                  borderRadius: '50%',
                  top: 2,
                  left: perms.includes(perm.key) ? 16 : 2,
                  background: perms.includes(perm.key) ? 'var(--yellow)' : 'var(--text-mute)',
                  transition: 'all 0.2s',
                }} />
              </span>
            </label>
          </div>
        ))}
      </div>

      <div className="confirm-actions">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={updatePerms.isPending}>
          {updatePerms.isPending ? <span className="spinner-sm" /> : 'Save'}
        </button>
      </div>
    </div>
  );
}

function AddMemberModal({ workspaceId, onClose }) {
  const createMember = useCreateMember(workspaceId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let newPw = '';
    for (let i = 0; i < 10; i++) {
      newPw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPw);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter name');
    if (!email.trim()) return setError('Please enter email');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    try {
      await createMember.mutateAsync({ name, email, password, role });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create profile');
    }
  };

  return (
    <form onSubmit={handleSave} style={{ padding: 24, width: 420 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Create Employee Profile</h3>
      <p style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 20 }}>
        Create credentials for a new team member directly. They can sign in immediately using these.
      </p>

      {error && (
        <div style={{ padding: '8px 12px', background: 'rgba(235, 87, 87, 0.1)', border: '1px solid var(--danger)', borderRadius: 6, fontSize: 12, color: 'var(--danger)', marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          Full Name
        </label>
        <input
          type="text"
          className="input"
          placeholder="e.g. Sarah Connor"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ padding: '9px 12px', fontSize: 13 }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          Work Email
        </label>
        <input
          type="email"
          className="input"
          placeholder="sarah@company.io"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: '9px 12px', fontSize: 13 }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
            Temporary Password
          </label>
          <button
            type="button"
            onClick={generatePassword}
            style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            ⚡ Auto-generate
          </button>
        </div>
        <input
          type="text"
          className="input"
          placeholder="Min. 6 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: '9px 12px', fontSize: 13 }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          Workspace Role
        </label>
        <select
          className="input"
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{ padding: '9px 12px', fontSize: 13 }}
        >
          <option value="employee">Employee (Regular)</option>
          <option value="manager">Manager (Can manage projects/tasks)</option>
          <option value="admin">Admin (Full Control)</option>
        </select>
      </div>

      <div className="confirm-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 10 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={createMember.isPending}>
          {createMember.isPending ? <span className="spinner-sm" /> : 'Create Profile'}
        </button>
      </div>
    </form>
  );
}

export default function MembersPage() {
  const { user } = useAuth();
  const openConfirm = useUIStore(s => s.openConfirmDialog);
  const workspaceId = user?.workspaceId?._id || user?.workspaceId;
  const { data: members = [], isLoading } = useWorkspaceMembers(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const [permsMember, setPermsMember] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 2 }}>Members</h1>
          <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{members.length}</span> members in this workspace
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Create Profile
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading
          ? Array(5).fill(0).map((_, i) => <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}><SkeletonCard /></div>)
          : members.length === 0
            ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No members yet</h3>
                <p>Share the invite link from Settings to add members.</p>
              </div>
            )
            : members.map((member, i) => (
              <div key={member.userId?._id || i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < members.length - 1 ? '1px solid var(--s2)' : 'none',
                  transition: 'var(--transition)',
                  position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar user={member.userId} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{member.userId?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{member.userId?.email}</div>
                </div>
                <RoleBadge role={member.role} />
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                    <button className="btn btn-outline btn-sm"
                      onClick={() => setPermsMember(member)}
                      style={{ fontSize: 11 }}>
                      ⚙ Permissions
                    </button>
                    {member.userId?._id !== user?._id && (
                      <button className="btn btn-sm"
                        style={{ fontSize: 11, border: '1px solid var(--border)', color: 'var(--text-mute)', background: 'transparent', transition: 'var(--transition)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mute)'; }}
                        onClick={() => openConfirm({
                          title: 'Remove member?',
                          message: `${member.userId?.name} will be removed from the workspace.`,
                          confirmLabel: 'Remove',
                          danger: true,
                          onConfirm: () => removeMember.mutate(member.userId._id),
                        })}>
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
        }
      </div>

      {/* Permissions Modal */}
      <Modal isOpen={!!permsMember} onClose={() => setPermsMember(null)}>
        {permsMember && (
          <PermissionsModal
            member={permsMember}
            workspaceId={workspaceId}
            onClose={() => setPermsMember(null)}
          />
        )}
      </Modal>

      {/* Create Profile Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <AddMemberModal
          workspaceId={workspaceId}
          onClose={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  );
}
