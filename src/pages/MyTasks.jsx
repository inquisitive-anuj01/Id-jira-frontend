import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useTasks, useDeleteTask } from '../hooks/useTasks.js';
import { useUIStore } from '../stores/uiStore.js';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { format, isPast } from 'date-fns';

const STATUSES = ['', 'backlog', 'todo', 'in_progress', 'in_review', 'done'];
const STATUS_LABELS = { '': 'All', backlog: 'Backlog', todo: 'Todo', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];
const PRIORITY_LABELS = { '': 'All Priority', low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export default function MyTasksPage() {
  const { user } = useAuth();
  const openTaskModal = useUIStore(s => s.openTaskModal);
  const openConfirm = useUIStore(s => s.openConfirmDialog);
  const deleteTask = useDeleteTask();

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const workspaceId = user?.workspaceId?._id || user?.workspaceId;

  const { data, isLoading } = useTasks({
    workspaceId,
    myTasks: 'true',
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    page,
    limit: 20,
  });

  const tasks = data?.data?.tasks || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const sorted = [...tasks].sort((a, b) => {
    let av = a[sortBy], bv = b[sortBy];
    if (!av) return 1; if (!bv) return -1;
    if (typeof av === 'string') av = av.toLowerCase(), bv = bv?.toLowerCase();
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const SortIcon = ({ col }) => (
    <span style={{ marginLeft: 4, opacity: sortBy === col ? 1 : 0.3, fontSize: 10 }}>
      {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const dueDateStyle = (task) => {
    if (!task.dueDate) return { color: 'var(--text-mute)' };
    if (task.status === 'done') return { color: 'var(--text-mute)' };
    if (isPast(new Date(task.dueDate))) return { color: 'var(--danger)', fontWeight: 600 };
    const diff = new Date(task.dueDate) - new Date();
    if (diff < 2 * 24 * 60 * 60 * 1000) return { color: 'var(--yellow)' };
    return { color: 'var(--text-sec)' };
  };

  const hasFilters = statusFilter || priorityFilter;

  return (
    <div className="page-enter">
      <div className="page-header-wrap">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 2 }}>My Tasks</h1>
          <p style={{ fontSize: 13, color: 'var(--text-sec)' }}>Tasks assigned to you across all projects</p>
        </div>
        <span className="badge badge-gray">{total} tasks</span>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        {STATUSES.map(s => (
          <button key={s} className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}>
            {STATUS_LABELS[s]}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
        {PRIORITIES.map(p => (
          <button key={p} className={`filter-pill ${priorityFilter === p ? 'active' : ''}`}
            onClick={() => { setPriorityFilter(p); setPage(1); }}>
            {PRIORITY_LABELS[p]}
          </button>
        ))}
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setStatusFilter(''); setPriorityFilter(''); setPage(1); }}
            style={{ color: 'var(--danger)', fontSize: 12 }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} style={{ cursor: 'pointer', width: '35%' }}>
                  Task Name <SortIcon col="title" />
                </th>
                <th>Project</th>
                <th onClick={() => handleSort('assigneeId')} style={{ cursor: 'pointer' }}>
                  Assignee <SortIcon col="assigneeId" />
                </th>
                <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>
                  Due Date <SortIcon col="dueDate" />
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status <SortIcon col="status" />
                </th>
                <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>
                  Priority <SortIcon col="priority" />
                </th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(8).fill(0).map((_, i) => <SkeletonRow key={i} />)
                : sorted.length === 0
                  ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <div className="empty-icon">✓</div>
                          <h3>No tasks yet</h3>
                          <p>Tasks assigned to you will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : sorted.map(task => (
                    <tr key={task._id} onClick={() => openTaskModal(task._id)}>
                      <td className="task-name-cell" style={{ maxWidth: 260 }}>
                        <span className="truncate" style={{ display: 'block' }}>{task.title}</span>
                      </td>
                      <td>
                        {task.projectId && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.projectId.color || 'var(--yellow)', display: 'inline-block' }} />
                            {task.projectId.name}
                          </span>
                        )}
                      </td>
                      <td>
                        {task.assigneeId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar user={task.assigneeId} size="sm" />
                            <span style={{ fontSize: 12 }}>{task.assigneeId.name}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-mute)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12, ...dueDateStyle(task) }}>
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '—'}
                      </td>
                      <td><StatusBadge status={task.status} /></td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 14, color: 'var(--text-mute)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirm({
                              title: 'Delete task?',
                              message: `"${task.title}" will be permanently deleted.`,
                              confirmLabel: 'Delete',
                              danger: true,
                              onConfirm: () => deleteTask.mutate(task._id),
                            });
                          }}>⋯</button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
