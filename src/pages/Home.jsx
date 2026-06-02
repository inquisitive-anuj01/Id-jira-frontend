import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useDashboard } from '../hooks/useNotifications.js';
import { useUIStore } from '../stores/uiStore.js';
import { SkeletonStatCard, SkeletonCard } from '../components/ui/Skeleton.jsx';
import Avatar, { ProjectAvatar } from '../components/ui/Avatar.jsx';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge.jsx';
import { formatDistanceToNow, isPast, format } from 'date-fns';

function greeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const emoji = h < 12 ? '☀️' : h < 17 ? '🌤' : '🌙';
  return `Good ${time}, ${name?.split(' ')[0] || 'there'}. ${emoji}`;
}

function StatCard({ label, value, delta, color, pulse }) {
  return (
    <div className={`stat-card card-lift ${pulse ? 'pulse-danger' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-num" style={{ color }}>{value ?? '—'}</div>
      {delta !== undefined && (
        <div className="stat-delta" style={{ color: delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--text-mute)' }}>
          {delta > 0 ? `▲ ${delta} this week` : delta < 0 ? `▼ ${Math.abs(delta)} this week` : '— no change'}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const openTaskModal = useUIStore(s => s.openTaskModal);
  const workspaceId = user?.workspaceId?._id || user?.workspaceId;
  const { data, isLoading } = useDashboard(workspaceId);

  const stats = data?.stats;
  const recentTasks = data?.recentTasks || [];
  const projects = data?.projects || [];
  const members = data?.members || [];

  const dueDateStyle = (task) => {
    if (!task.dueDate) return {};
    if (task.status === 'done') return { color: 'var(--text-mute)' };
    if (isPast(new Date(task.dueDate))) return { color: 'var(--danger)' };
    return { color: 'var(--text-sec)' };
  };

  if (!workspaceId) {
    return (
      <div className="empty-state page-enter">
        <div className="empty-icon">🏢</div>
        <h3>No Workspace Yet</h3>
        <p>You're not part of any workspace. Ask your admin to invite you.</p>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>
          {greeting(user?.name)}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>
          Here's what's happening in your workspace today.
        </p>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Tasks"   value={stats?.totalTasks}      color="var(--text)"    delta={0} />
            <StatCard label="Assigned"      value={stats?.assignedTasks}   color="var(--yellow)"  delta={0} />
            <StatCard label="Completed"     value={stats?.completedTasks}  color="var(--success)" delta={0} />
            <StatCard label="Overdue"       value={stats?.overdueTasks}    color="var(--danger)"  delta={0} pulse={stats?.overdueTasks > 0} />
            <StatCard label="Incomplete"    value={stats?.incompleteTasks} color="var(--text-sec)" delta={0} />
          </>
        )}
      </div>

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Recent Tasks */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Recent tasks</span>
            <span className="badge badge-yellow">{recentTasks.length}</span>
          </div>

          {isLoading ? <SkeletonCard /> : recentTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-icon">📋</div>
              <p>No tasks yet. Start building!</p>
            </div>
          ) : (
            recentTasks.map(task => (
              <div key={task._id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--s2)', cursor: 'pointer', transition: 'var(--transition)' }}
                onClick={() => openTaskModal(task._id)}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.projectId?.color || 'var(--yellow)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </span>
                <PriorityBadge priority={task.priority} />
                <span style={{ fontSize: 10, ...dueDateStyle(task) }}>
                  {task.dueDate ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }) : ''}
                </span>
              </div>
            ))
          )}

          <button
            className="btn btn-ghost w-full"
            style={{ marginTop: 10, border: '1px solid var(--border)', fontSize: 12, transition: 'var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--yellow)'; e.currentTarget.style.color = 'var(--yellow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = ''; }}
            onClick={() => navigate('/tasks')}
          >
            Show All
          </button>
        </div>

        {/* Projects */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Projects</span>
            <span className="badge badge-gray">{projects.length}</span>
          </div>

          {isLoading ? <SkeletonCard /> : projects.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-icon">📁</div>
              <p>No projects yet.</p>
            </div>
          ) : (
            projects.map(proj => (
              <div key={proj._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: 9, borderRadius: 8, border: '1px solid var(--border)',
                  marginBottom: 6, cursor: 'pointer',
                  background: 'var(--s2)', transition: 'var(--transition)'
                }}
                onClick={() => navigate(`/projects/${proj._id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--yellow)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <ProjectAvatar project={proj} size="md" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{proj.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                    {proj.members?.length || 0} members
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Members widget */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Team members</span>
          <span className="badge badge-gray">{members.length}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {members.map(m => (
            <div key={m._id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: 'var(--s2)', border: '1px solid var(--border)' }}>
              <Avatar user={m} size="md" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{m.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
