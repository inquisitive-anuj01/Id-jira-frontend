import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProjects.js';
import { useTasks, useCreateTask, useReorderTasks, useDeleteTask } from '../hooks/useTasks.js';
import { useAuth } from '../hooks/useAuth.js';
import { useUIStore } from '../stores/uiStore.js';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge.jsx';
import Avatar, { ProjectAvatar } from '../components/ui/Avatar.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import Modal from '../components/ui/Modal.jsx';
import { toast } from 'react-toastify';
import { format, isPast } from 'date-fns';
import api from '../lib/api.js';

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',     color: 'var(--text-mute)' },
  { id: 'todo',        label: 'Todo',         color: 'var(--danger)' },
  { id: 'in_progress', label: 'In Progress',  color: 'var(--yellow)' },
  { id: 'in_review',   label: 'In Review',    color: 'var(--warning)' },
  { id: 'done',        label: 'Done',         color: 'var(--success)' },
];

// ─── Kanban View ──────────────────────────────────────────────────
function KanbanView({ tasks, projectId, workspaceId, onTaskClick }) {
  const reorderTasks = useReorderTasks();
  const createTask = useCreateTask();
  const [inlineCol, setInlineCol] = useState(null);
  const [inlineTitle, setInlineTitle] = useState('');

  const columns = COLUMNS.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.status === col.id).sort((a, b) => a.order - b.order),
  }));

  const onDragEnd = useCallback(async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const colTasks = tasks.filter(t => t.status === newStatus).sort((a, b) => a.order - b.order);
    const reordered = [...colTasks.filter(t => t._id !== draggableId)];
    const moved = tasks.find(t => t._id === draggableId);
    reordered.splice(destination.index, 0, moved);

    const updates = reordered.map((t, i) => ({ id: t._id, order: i, status: newStatus }));
    await reorderTasks.mutateAsync(updates);
    toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
  }, [tasks, reorderTasks]);

  const handleInlineSave = async (colId) => {
    if (!inlineTitle.trim()) { setInlineCol(null); return; }
    await createTask.mutateAsync({
      title: inlineTitle.trim(),
      projectId,
      workspaceId,
      status: colId,
    });
    setInlineTitle('');
    setInlineCol(null);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {columns.map(col => (
          <Droppable key={col.id} droppableId={col.id}>
            {(provided, snapshot) => (
              <div
                className={`kanban-col ${snapshot.isDraggingOver ? 'is-drag-over' : ''}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {/* Column Header */}
                <div className="kanban-col-header">
                  <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="kanban-col-count">{col.tasks.length}</span>
                    <button
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 5, width: 20, height: 20, cursor: 'pointer', color: 'var(--text-mute)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}
                      onClick={() => { setInlineCol(col.id); setInlineTitle(''); }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--yellow)'; e.currentTarget.style.color = 'var(--yellow)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mute)'; }}
                    >+</button>
                  </div>
                </div>

                {/* Inline add */}
                {inlineCol === col.id && (
                  <div style={{ background: 'var(--s2)', border: '1px dashed var(--s3)', borderRadius: 8, padding: 8, marginBottom: 7 }}>
                    <textarea
                      autoFocus
                      className="input"
                      placeholder="Task title..."
                      value={inlineTitle}
                      onChange={e => setInlineTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); handleInlineSave(col.id); }
                        if (e.key === 'Escape') setInlineCol(null);
                      }}
                      style={{ background: 'none', border: 'none', padding: '4px 0', fontSize: 12, resize: 'none', minHeight: 32 }}
                      rows={2}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => handleInlineSave(col.id)}>Add</button>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 10px', border: '1px solid var(--border)' }} onClick={() => setInlineCol(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Cards */}
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
                                background: isPast(new Date(task.dueDate)) && task.status !== 'done'
                                  ? 'rgba(226,75,74,0.12)' : 'var(--s2)',
                                color: isPast(new Date(task.dueDate)) && task.status !== 'done'
                                  ? 'var(--danger)' : 'var(--text-mute)'
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
        ))}
      </div>
    </DragDropContext>
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
                  <p>Click + New to create the first task.</p>
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
function CalendarView({ tasks, onTaskClick, onDayClick }) {
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
        {/* Prev month padding */}
        {Array(firstDay).fill(0).map((_, i) => (
          <div key={`prev-${i}`} className="calendar-day other-month">
            <div className="day-number">{new Date(year, month, 0).getDate() - firstDay + i + 1}</div>
          </div>
        ))}

        {/* Current month days */}
        {Array(daysInMonth).fill(0).map((_, i) => {
          const day = i + 1;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const dayTasks = tasksByDay[day] || [];
          const maxShow = 3;
          return (
            <div
              key={day}
              className={`calendar-day ${isToday ? 'today' : ''}`}
              onClick={() => onDayClick && onDayClick(new Date(year, month, day))}
            >
              <div className="day-number">{day}</div>
              {dayTasks.slice(0, maxShow).map(task => (
                <div
                  key={task._id}
                  className="cal-task-chip"
                  style={{
                    background: task.projectId?.color
                      ? `${task.projectId.color}26`
                      : 'rgba(244,199,26,0.15)',
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
  const { user } = useAuth();
  const openTaskModal = useUIStore(s => s.openTaskModal);
  const createTask = useCreateTask();

  const { data: projectData, isLoading: projLoading } = useProject(id);
  const project = projectData?.project;
  const stats = projectData?.stats;

  const [view, setView] = useState('kanban');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', status: 'todo', priority: 'medium' });

  const workspaceId = user?.workspaceId?._id || user?.workspaceId;

  const { data: tasksData, isLoading: tasksLoading } = useTasks({ projectId: id, limit: 100 });
  const tasks = tasksData?.data?.tasks || [];

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    await createTask.mutateAsync({ ...newTask, projectId: id, workspaceId });
    setNewTask({ title: '', status: 'todo', priority: 'medium' });
    setShowNewTask(false);
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
      {/* Project Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ProjectAvatar project={project} size="xl" />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>{project.name}</h1>
            {project.description && (
              <p style={{ fontSize: 13, color: 'var(--text-sec)', maxWidth: 400 }}>{project.description}</p>
            )}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewTask(true)}>
          + New Task
        </button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
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

      {/* View Toggle + Filter Bar */}
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
            <KanbanView tasks={tasks} projectId={id} workspaceId={workspaceId} onTaskClick={openTaskModal} />
          )}
          {view === 'table' && (
            <TableView tasks={tasks} onTaskClick={openTaskModal} />
          )}
          {view === 'calendar' && (
            <CalendarView tasks={tasks} onTaskClick={openTaskModal} />
          )}
        </>
      )}

      {/* New Task Modal */}
      <Modal isOpen={showNewTask} onClose={() => setShowNewTask(false)}>
        <form onSubmit={handleCreateTask} style={{ padding: 24, width: 400 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>New Task</h3>
          <div style={{ marginBottom: 12 }}>
            <label className="section-label">Title</label>
            <input className="input" autoFocus placeholder="Task title..."
              value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div>
              <label className="section-label">Status</label>
              <select className="input" value={newTask.status} onChange={e => setNewTask(p => ({ ...p, status: e.target.value }))}>
                <option value="backlog">Backlog</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="section-label">Priority</label>
              <select className="input" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="confirm-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNewTask(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={createTask.isPending}>
              {createTask.isPending ? <span className="spinner-sm" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
