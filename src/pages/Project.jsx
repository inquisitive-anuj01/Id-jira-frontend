import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject, useDeleteProject, useAddCustomStatus, useDeleteCustomStatus, useReorderStatuses } from '../hooks/useProjects.js';
import { useTasks, useCreateTask, useReorderTasks, useDeleteTask } from '../hooks/useTasks.js';
import { useAuth } from '../hooks/useAuth.js';
import { useUIStore } from '../stores/uiStore.js';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge.jsx';
import Avatar, { ProjectAvatar } from '../components/ui/Avatar.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { toast } from 'react-toastify';
import { format, isPast } from 'date-fns';

const DEFAULT_COLUMNS = [
  { id: 'backlog',     label: 'Backlog',     color: 'var(--text-mute)' },
  { id: 'todo',        label: 'Todo',        color: 'var(--danger)' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--yellow)' },
  { id: 'in_review',   label: 'In Review',   color: 'var(--warning)' },
  { id: 'done',        label: 'Done',        color: 'var(--success)' },
];

const PRESET_COLORS = [
  '#6366f1', '#f43f5e', '#f4c71a', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
];

// ─── Edit Project Modal ──────────────────────────────────────────
function EditProjectModal({ isOpen, onClose, project }) {
  const updateProject = useUpdateProject(project?._id);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDesc(project.description || '');
      setColor(project.color || '#6366f1');
      setIcon(project.icon || '');
    }
  }, [project, isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Project name is required');
    await updateProject.mutateAsync({ name: name.trim(), description: desc, color, icon });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSave} style={{ padding: 28, width: '100%', maxWidth: 440, boxSizing: 'border-box' }}>
        <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 700 }}>✏️ Edit Project</h3>

        <div style={{ marginBottom: 14 }}>
          <label className="section-label">Project Name</label>
          <input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="My awesome project" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="section-label">Description</label>
          <textarea className="input" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's this project about?" style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="section-label">Icon (emoji)</label>
            <input className="input" value={icon} onChange={e => setIcon(e.target.value)} placeholder="🚀" maxLength={2} />
          </div>
          <div>
            <label className="section-label">Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: color === c ? '2.5px solid #fff' : 'none',
                    boxShadow: color === c ? `0 0 0 1px ${c}` : 'none',
                  }} />
              ))}
            </div>
          </div>
        </div>

        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={updateProject.isPending}>
            {updateProject.isPending ? <span className="spinner-sm" /> : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Add Status Modal ─────────────────────────────────────────────
function AddStatusModal({ isOpen, onClose, projectId }) {
  const addStatus = useAddCustomStatus(projectId);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#6366f1');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    await addStatus.mutateAsync({ label: label.trim(), color });
    setLabel('');
    setColor('#6366f1');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleAdd} style={{ padding: 24, width: '100%', maxWidth: 360, boxSizing: 'border-box' }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>✨ Add Custom Status</h3>
        <div style={{ marginBottom: 14 }}>
          <label className="section-label">Status Name</label>
          <input className="input" autoFocus value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. QA Testing" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="section-label">Color</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                  outline: color === c ? '2.5px solid #fff' : 'none',
                  boxShadow: color === c ? `0 0 0 1.5px ${c}` : 'none',
                }} />
            ))}
          </div>
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={addStatus.isPending || !label.trim()}>
            {addStatus.isPending ? <span className="spinner-sm" /> : '+ Add Status'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────
function KanbanView({ tasks, project, projectId, workspaceId, onTaskClick, canManage }) {
  const reorderTasks = useReorderTasks();
  const deleteCustomStatus = useDeleteCustomStatus(projectId);
  const reorderStatuses = useReorderStatuses(projectId);
  const openTaskModal = useUIStore(s => s.openTaskModal);
  const openConfirm = useUIStore(s => s.openConfirmDialog);

  const [showAddStatus, setShowAddStatus] = useState(false);
  const [inlineCol, setInlineCol] = useState(null);
  const [inlineTitle, setInlineTitle] = useState('');

  // Merge default + custom columns
  const customCols = (project?.customStatuses || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(cs => ({ id: cs.id, label: cs.label, color: cs.color, isCustom: true }));

  const rawColumns = [...DEFAULT_COLUMNS, ...customCols];

  // Order all columns by project.columnOrder if defined
  let allColumns = [...rawColumns];
  if (project?.columnOrder && project.columnOrder.length > 0) {
    const orderMap = new Map();
    project.columnOrder.forEach((id, idx) => orderMap.set(id, idx));
    allColumns.sort((a, b) => {
      const aIdx = orderMap.has(a.id) ? orderMap.get(a.id) : 999;
      const bIdx = orderMap.has(b.id) ? orderMap.get(b.id) : 999;
      return aIdx - bIdx;
    });
  }

  const columns = allColumns.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.status === col.id).sort((a, b) => a.order - b.order),
  }));

  // Unified drag end — handles TASK drags (column DnD removed)
  const onDragEnd = useCallback(async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // ── Task reorder / move ──────────────────────────────────────
    const newStatus = destination.droppableId;
    const colTasks = tasks.filter(t => t.status === newStatus).sort((a, b) => a.order - b.order);
    const reordered = [...colTasks.filter(t => t._id !== draggableId)];
    const moved = tasks.find(t => t._id === draggableId);
    if (!moved) return;
    reordered.splice(destination.index, 0, moved);
    const updates = reordered.map((t, i) => ({ id: t._id, order: i, status: newStatus }));
    await reorderTasks.mutateAsync(updates);
  }, [tasks, reorderTasks]);

  const handleOrderChange = async (colId, currentPos, newPos) => {
    if (currentPos === newPos) return;

    // Get current array of column IDs in order
    const orderedIds = columns.map(c => c.id);

    // Remove the column from currentPos
    const [moved] = orderedIds.splice(currentPos, 1);

    // Insert at newPos
    orderedIds.splice(newPos, 0, moved);

    try {
      await reorderStatuses.mutateAsync(orderedIds);
      toast.success('Column order updated');
    } catch (err) {
      toast.error('Failed to update column order');
    }
  };

  const handleInlineAdd = async (colId) => {
    if (!inlineTitle.trim()) { setInlineCol(null); return; }
    openTaskModal(null, { projectId, workspaceId, initialStatus: colId, prefillTitle: inlineTitle.trim() });
    setInlineTitle('');
    setInlineCol(null);
  };

  const handleDeleteStatus = (col) => {
    openConfirm({
      title: `Delete "${col.label}" status?`,
      message: 'All tasks in this status will be moved to Backlog.',
      confirmLabel: 'Delete Status',
      danger: true,
      onConfirm: () => deleteCustomStatus.mutate(col.id),
    });
  };

  return (
    <>
      <AddStatusModal isOpen={showAddStatus} onClose={() => setShowAddStatus(false)} projectId={projectId} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board" style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}>
          {columns.map((col, colIndex) => (
            <div key={col.id} className="kanban-col">
              {/* Column Header */}
              <div className="kanban-col-header" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {canManage ? (
                    <select
                      value={colIndex + 1}
                      onChange={(e) => handleOrderChange(col.id, colIndex, parseInt(e.target.value, 10) - 1)}
                      title="Change column position"
                      style={{
                        background: 'var(--s2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        padding: '1px 3px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {columns.map((_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span style={{
                      background: 'var(--s2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-mute)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      padding: '1px 5px',
                    }}>
                      {colIndex + 1}
                    </span>
                  )}

                  <span className="kanban-col-title" style={{ color: col.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {col.isCustom && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block', flexShrink: 0 }} />
                    )}
                    {col.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="kanban-col-count">{col.tasks.length}</span>
                  {/* Add task to column */}
                  <button
                    title="Add task"
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 5, width: 20, height: 20, cursor: 'pointer', color: 'var(--text-mute)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}
                    onClick={() => { setInlineCol(col.id); setInlineTitle(''); }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--yellow)'; e.currentTarget.style.color = 'var(--yellow)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mute)'; }}
                  >+</button>
                  {/* Delete custom status */}
                  {col.isCustom && canManage && (
                    <button
                      title="Delete status"
                      style={{ background: 'none', border: '1px solid transparent', borderRadius: 5, width: 18, height: 18, cursor: 'pointer', color: 'var(--text-mute)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}
                      onClick={() => handleDeleteStatus(col)}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mute)'; }}
                    >✕</button>
                  )}
                </div>
              </div>

              {/* Tasks List Container */}
              <Droppable droppableId={col.id} type="TASK">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-tasks-list ${snapshot.isDraggingOver ? 'is-drag-over' : ''}`}
                  >
                    {/* Inline quick-add */}
                    {inlineCol === col.id && (
                      <div style={{ background: 'var(--s2)', border: '1px dashed var(--s3)', borderRadius: 8, padding: 8, marginBottom: 7 }}>
                        <textarea
                          autoFocus
                          className="input"
                          placeholder="Task title… (Enter to add)"
                          value={inlineTitle}
                          onChange={e => setInlineTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleInlineAdd(col.id); }
                            if (e.key === 'Escape') setInlineCol(null);
                          }}
                          style={{ background: 'none', border: 'none', padding: '4px 0', fontSize: 12, resize: 'none', minHeight: 32 }}
                          rows={2}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => handleInlineAdd(col.id)}>Add</button>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 10px', border: '1px solid var(--border)' }} onClick={() => setInlineCol(null)}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Task cards */}
                    {col.tasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(drag, dragSnap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={`task-card ${dragSnap.isDragging ? 'is-dragging' : ''}`}
                            onClick={() => onTaskClick(task._id)}
                          >
                            <div className="task-card-title">{task.title}</div>
                            <div className="task-card-footer">
                              <PriorityBadge priority={task.priority} />
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {task.assigneeId && <Avatar user={task.assigneeId} size="sm" title={task.assigneeId.name} />}
                                {task.dueDate && (
                                  <span style={{
                                    fontSize: 10, padding: '1px 6px', borderRadius: 99,
                                    background: isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'rgba(226,75,74,0.12)' : 'var(--s2)',
                                    color: isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'var(--danger)' : 'var(--text-mute)',
                                  }}>
                                    {format(new Date(task.dueDate), 'MMM d')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {col.tasks.length === 0 && inlineCol !== col.id && (
                      <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: '14px 8px', textAlign: 'center', fontSize: 11, color: 'var(--text-mute)' }}>
                        Drop tasks here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}

          {/* Add Status button */}
          {canManage && (
            <div style={{ minWidth: 160, display: 'flex', alignItems: 'flex-start', paddingTop: 4, marginLeft: 12 }}>
              <button
                onClick={() => setShowAddStatus(true)}
                style={{
                  background: 'var(--s1)', border: '1.5px dashed var(--border)', borderRadius: 10, padding: '8px 14px',
                  color: 'var(--text-mute)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'var(--transition)', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--yellow)'; e.currentTarget.style.color = 'var(--yellow)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mute)'; }}
              >
                + Add Status
              </button>
            </div>
          )}
        </div>
      </DragDropContext>
    </>
  );
}


// ─── Table View ───────────────────────────────────────────────────
function TableView({ tasks, onTaskClick }) {
  const openConfirm = useUIStore(s => s.openConfirmDialog);
  const deleteTask = useDeleteTask();

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Task Name</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Priority</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No tasks yet</h3>
                  <p>Click + New Task to create the first task.</p>
                </div>
              </td></tr>
            ) : tasks.map(task => (
              <tr key={task._id} onClick={() => onTaskClick(task._id)}>
                <td className="task-name-cell">{task.title}</td>
                <td>
                  {task.assigneeId
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar user={task.assigneeId} size="sm" /><span style={{ fontSize: 12 }}>{task.assigneeId.name}</span></div>
                    : <span style={{ color: 'var(--text-mute)', fontSize: 12 }}>—</span>}
                </td>
                <td style={{ fontSize: 12, color: task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'var(--danger)' : 'var(--text-sec)' }}>
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                </td>
                <td><StatusBadge status={task.status} /></td>
                <td><PriorityBadge priority={task.priority} /></td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 14, color: 'var(--text-mute)' }}
                    onClick={e => {
                      e.stopPropagation();
                      openConfirm({ title: 'Delete task?', message: `"${task.title}" will be deleted.`, confirmLabel: 'Delete', danger: true, onConfirm: () => deleteTask.mutate(task._id) });
                    }}>⋯</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────
function CalendarView({ tasks, onTaskClick }) {
  const [current, setCurrent] = useState(new Date());

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const tasksByDay = {};
  tasks.forEach(task => {
    if (!task.dueDate) return;
    const d = new Date(task.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!tasksByDay[key]) tasksByDay[key] = [];
      tasksByDay[key].push(task);
    }
  });

  const changeMonth = (dir) => {
    setCurrent(new Date(year, month + dir, 1));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Calendar Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-icon" onClick={() => changeMonth(-1)} style={{ width: 30, height: 30, borderRadius: '50%' }}>‹</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', minWidth: 160 }}>
          {current.toLocaleString('en', { month: 'long', year: 'numeric' })}
        </h2>
        <button className="btn btn-icon" onClick={() => changeMonth(1)} style={{ width: 30, height: 30, borderRadius: '50%' }}>›</button>
        <button className="btn btn-outline btn-sm" onClick={() => setCurrent(new Date())}>Today</button>
      </div>

      {/* Day headers */}
      <div className="calendar-grid" style={{ marginBottom: 4 }}>
        {dayNames.map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="calendar-grid">
        {Array(firstDay).fill(0).map((_, i) => (
          <div key={`prev-${i}`} className="calendar-day other-month">
            <div className="day-number">{new Date(year, month, 0).getDate() - firstDay + i + 1}</div>
          </div>
        ))}
        {Array(daysInMonth).fill(0).map((_, i) => {
          const day = i + 1;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const dayTasks = tasksByDay[day] || [];
          const maxShow = 3;
          return (
            <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
              <div className="day-number">{day}</div>
              {dayTasks.slice(0, maxShow).map(task => (
                <div
                  key={task._id}
                  className="cal-task-chip"
                  style={{
                    background: task.projectId?.color ? `${task.projectId.color}26` : 'rgba(244,199,26,0.15)',
                    color: task.projectId?.color || 'var(--yellow)',
                  }}
                  onClick={e => { e.stopPropagation(); onTaskClick(task._id); }}
                >
                  {task.title}
                </div>
              ))}
              {dayTasks.length > maxShow && (
                <div style={{ fontSize: 10, color: 'var(--text-mute)', paddingLeft: 2, cursor: 'pointer' }}>
                  +{dayTasks.length - maxShow} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Project Page ────────────────────────────────────────────
export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const openTaskModal = useUIStore(s => s.openTaskModal);
  const openConfirm = useUIStore(s => s.openConfirmDialog);

  const deleteProject = useDeleteProject(id);

  const { data: projectData, isLoading: projLoading } = useProject(id);
  const project = projectData?.project;
  const stats = projectData?.stats;

  const [view, setView] = useState('kanban');
  const [showEditProject, setShowEditProject] = useState(false);

  const workspaceId = user?.workspaceId?._id || user?.workspaceId;

  // Check permission: can the user manage project (edit/delete statuses)?
  const userMember = user?.workspaceId?.members?.find?.(m => m.userId === user._id)
    || { role: user?.role, permissions: user?.permissions || [] };
  const canManage = user?.role === 'admin'
    || userMember?.role === 'admin'
    || userMember?.permissions?.includes('edit_project');

  const { data: tasksData, isLoading: tasksLoading } = useTasks({ projectId: id, limit: 200 });
  const tasks = tasksData?.data?.tasks || [];

  const handleDeleteProject = () => {
    openConfirm({
      title: `Delete "${project?.name}"?`,
      message: 'This will permanently delete the project and ALL its tasks. This cannot be undone.',
      confirmLabel: 'Delete Project',
      danger: true,
      onConfirm: async () => {
        await deleteProject.mutateAsync();
        navigate('/');
      },
    });
  };

  if (projLoading) {
    return (
      <div className="page-enter" style={{ display: 'grid', gap: 14 }}>
        <SkeletonCard style={{ height: 80 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  return (
    <div className="page-enter">
      {/* Edit Project Modal */}
      <EditProjectModal isOpen={showEditProject} onClose={() => setShowEditProject(false)} project={project} />

      {/* Project Header */}
      <div className="project-header-wrap">
        <div className="project-header-left">
          <ProjectAvatar project={project} size="xl" />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>{project.name}</h1>
            {project.description && (
              <p style={{ fontSize: 13, color: 'var(--text-sec)', maxWidth: 400 }}>{project.description}</p>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {canManage && (
            <>
              <button
                className="btn btn-outline btn-sm"
                style={{ gap: 4 }}
                onClick={() => setShowEditProject(true)}
                title="Edit Project"
              >
                ✏️ Edit
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleDeleteProject}
                title="Delete Project"
              >
                🗑 Delete
              </button>
            </>
          )}
          <button
            className="btn btn-primary"
            onClick={() => openTaskModal(null, { projectId: id, workspaceId })}
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="project-stats-grid">
          {[
            { label: 'Total', value: stats.total, color: 'var(--text)' },
            { label: 'Done', value: stats.done, color: 'var(--success)' },
            { label: 'Overdue', value: stats.overdue, color: 'var(--danger)' },
            { label: 'In Progress', value: stats.inProgress, color: 'var(--yellow)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-num" style={{ color: s.color, fontSize: 22 }}>{s.value ?? 0}</div>
            </div>
          ))}
        </div>
      )}

      {/* View Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div className="view-toggle">
          {['table', 'kanban', 'calendar'].map(v => (
            <button key={v} className={`view-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v === 'table' ? '☰ Table' : v === 'kanban' ? '⬛ Kanban' : '📅 Calendar'}
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {tasksLoading ? (
        <div style={{ display: 'flex', gap: 12 }}>
          {Array(5).fill(0).map((_, i) => <SkeletonCard key={i} style={{ flex: 1 }} />)}
        </div>
      ) : (
        <>
          {view === 'kanban' && (
            <KanbanView
              tasks={tasks}
              project={project}
              projectId={id}
              workspaceId={workspaceId}
              onTaskClick={openTaskModal}
              canManage={canManage}
            />
          )}
          {view === 'table' && (
            <TableView tasks={tasks} onTaskClick={openTaskModal} />
          )}
          {view === 'calendar' && (
            <CalendarView tasks={tasks} onTaskClick={openTaskModal} />
          )}
        </>
      )}
    </div>
  );
}
