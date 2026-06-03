import { useState, useRef, useEffect } from 'react';
import { useTask, useUpdateTask, useDeleteTask, useComments, useCreateComment, useDeleteComment, useCreateTask } from '../../hooks/useTasks.js';
import { useProject, useAddCustomStatus } from '../../hooks/useProjects.js';
import { useUsers } from '../../hooks/useNotifications.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useUIStore } from '../../stores/uiStore.js';
import Modal from '../ui/Modal.jsx';
import Avatar, { ProjectAvatar } from '../ui/Avatar.jsx';
import { StatusBadge, PriorityBadge } from '../ui/Badge.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { toast } from 'react-toastify';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import api from '../../lib/api.js';

const DEFAULT_STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRESET_COLORS = ['#6366f1','#f43f5e','#f4c71a','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#64748b'];

function CustomDatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value));
    }
  }, [value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days = [];

  // Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    });
  }

  // Days in current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  // Leading days from next month
  const totalDays = days.length;
  const remaining = 42 - totalDays;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayObj) => {
    const selected = new Date(dayObj.year, dayObj.month, dayObj.day);
    onChange(selected.toISOString());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    onChange(today.toISOString());
    setIsOpen(false);
  };

  const isSelected = (dayObj) => {
    if (!value) return false;
    const valDate = new Date(value);
    return valDate.getDate() === dayObj.day &&
      valDate.getMonth() === dayObj.month &&
      valDate.getFullYear() === dayObj.year;
  };

  const isToday = (dayObj) => {
    const today = new Date();
    return today.getDate() === dayObj.day &&
      today.getMonth() === dayObj.month &&
      today.getFullYear() === dayObj.year;
  };

  const displayDate = value ? format(new Date(value), 'MMM d, yyyy') : 'Not set';

  const getDayColor = (d, selected) => {
    if (selected) return 'var(--dark)';
    if (isToday(d)) return 'var(--yellow)';
    return d.isCurrentMonth ? 'var(--text)' : 'var(--text-mute)';
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="field-val"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          cursor: 'pointer',
          padding: '6px 10px',
          borderRadius: 'var(--radius)',
          background: 'var(--s2)',
          border: '1px solid var(--border)',
          transition: 'var(--transition)',
          fontSize: '12px',
          position: 'relative'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--yellow)'}
        onMouseLeave={e => { if(!isOpen) e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <span>📅</span>
        <span style={{ color: value ? 'var(--text)' : 'var(--text-mute)', fontWeight: value ? '600' : '400' }}>
          {displayDate}
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '38px',
          right: 0,
          background: 'var(--s1)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          zIndex: 500,
          width: '240px',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button type="button" onClick={handlePrevMonth} style={{ color: 'var(--text-sec)', padding: '2px 6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>←</button>
            <span style={{ fontSize: '13px', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>
              {monthNames[month]} {year}
            </span>
            <button type="button" onClick={handleNextMonth} style={{ color: 'var(--text-sec)', padding: '2px 6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>→</button>
          </div>

          {/* Weekday labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: 6 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((wd, i) => (
              <span key={i} style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-mute)' }}>{wd}</span>
            ))}
          </div>

          {/* Day Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {days.map((d, i) => {
              const selected = isSelected(d);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDaySelect(d)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '24px',
                    width: '24px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: selected || isToday(d) ? '700' : '400',
                    cursor: 'pointer',
                    background: selected ? 'var(--yellow)' : 'transparent',
                    color: getDayColor(d, selected),
                    border: isToday(d) && !selected ? '1px solid var(--yellow)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!selected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!selected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {d.day}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <button 
              type="button" 
              onClick={handleClear} 
              style={{ fontSize: '11px', fontWeight: '600', color: 'var(--danger)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              Clear
            </button>
            <button 
              type="button" 
              onClick={handleToday} 
              style={{ fontSize: '11px', fontWeight: '600', color: 'var(--yellow)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskModal({ isOpen, taskId, mode = 'view', context = null, onClose }) {
  const { user } = useAuth();
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask(taskId);
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const { data: comments = [] } = useComments(taskId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const openConfirm = useUIStore(s => s.openConfirmDialog);
  const openTaskModal = useUIStore(s => s.openTaskModal);

  // Create-mode form state
  const [createForm, setCreateForm] = useState({
    title: context?.prefillTitle || '',
    description: '',
    status: context?.initialStatus || 'todo',
    priority: 'medium',
    assigneeId: '',
    dueDate: null,
    startDate: null,
  });

  // Add-status inline state (for both view & create modes)
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6366f1');

  const [commentText, setCommentText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [showPriorityDrop, setShowPriorityDrop] = useState(false);
  const [showAssigneeDrop, setShowAssigneeDrop] = useState(false);
  const [titleEdit, setTitleEdit] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [titleSaving, setTitleSaving] = useState(false);
  const [titleSaved, setTitleSaved] = useState(false);
  const [descVal, setDescVal] = useState('');
  const [dueDateVal, setDueDateVal] = useState('');
  const [startDateVal, setStartDateVal] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);
  const titleRef = useRef(null);
  const assigneeRef = useRef(null);
  const priorityRef = useRef(null);
  const statusRef = useRef(null);
  const reassignBtnRef = useRef(null);
  const workspaceId = user?.workspaceId?._id || user?.workspaceId;
  const { data: members = [] } = useUsers(workspaceId, '');

  // Fetch project for custom statuses (works in both view and create mode)
  const resolvedProjectId = task?.projectId?._id || task?.projectId || context?.projectId;
  const { data: projectData } = useProject(resolvedProjectId);
  const customStatuses = projectData?.project?.customStatuses || [];
  const addCustomStatus = useAddCustomStatus(resolvedProjectId);

  const ALL_STATUSES = [
    ...DEFAULT_STATUSES,
    ...customStatuses.map(cs => cs.id),
  ];
  const statusLabel = (s) => {
    const custom = customStatuses.find(cs => cs.id === s);
    if (custom) return custom.label;
    return s.replace('_', ' ');
  };

  const handleAddStatusSubmit = async (e) => {
    e.preventDefault();
    if (!newStatusLabel.trim() || !resolvedProjectId) return;
    await addCustomStatus.mutateAsync({ label: newStatusLabel.trim(), color: newStatusColor });
    setNewStatusLabel('');
    setNewStatusColor('#6366f1');
    setShowAddStatusModal(false);
  };

  useEffect(() => {
    if (task) {
      setTitleVal(task.title);
      setDescVal(task.description || '');
      setDueDateVal(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
      setStartDateVal(task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '');
    }
  }, [task]);

  // Reset create form when context changes (new column, new project)
  useEffect(() => {
    if (mode === 'create') {
      setCreateForm({
        title: context?.prefillTitle || '',
        description: '',
        status: context?.initialStatus || 'todo',
        priority: 'medium',
        assigneeId: '',
      });
    }
  }, [mode, context?.projectId, context?.initialStatus, context?.prefillTitle]);



  // Fetch activity logs
  useEffect(() => {
    if (!taskId) return;
    api.get(`/tasks/${taskId}/activity`).then(r => {
      if (r.data?.data?.logs) setActivityLogs(r.data.data.logs);
    }).catch(() => {});
  }, [taskId]);

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        if (!reassignBtnRef.current || !reassignBtnRef.current.contains(e.target)) {
          setShowAssigneeDrop(false);
        }
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target)) {
        setShowPriorityDrop(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setShowStatusDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleBlur = async () => {
    if (!titleVal.trim() || titleVal === task?.title) { setTitleEdit(false); return; }
    setTitleSaving(true);
    await updateTask.mutateAsync({ title: titleVal.trim() });
    setTitleSaving(false);
    setTitleSaved(true);
    setTimeout(() => setTitleSaved(false), 1000);
    setTitleEdit(false);
  };

  const handleDescBlur = async () => {
    if (descVal === task?.description) return;
    await updateTask.mutateAsync({ description: descVal });
  };

  const handleStatus = async (status) => {
    await updateTask.mutateAsync({ status });
    setShowStatusDrop(false);
    // No toast — only Save Changes fires a toast
  };

  const handlePriority = async (priority) => {
    await updateTask.mutateAsync({ priority });
    setShowPriorityDrop(false);
  };

  const handleAssign = async (assigneeId) => {
    await updateTask.mutateAsync({ assigneeId });
    setShowAssigneeDrop(false);
    // No toast — only Save Changes fires a toast
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await createComment.mutateAsync({ taskId, body: commentText.trim() });
    setCommentText('');
  };

  const handleDueDateChange = async (dateVal) => {
    setDueDateVal(dateVal ? format(new Date(dateVal), 'yyyy-MM-dd') : '');
    await updateTask.mutateAsync({ dueDate: dateVal });
    // No toast — only Save Changes fires a toast
  };

  const handleStartDateChange = async (dateVal) => {
    setStartDateVal(dateVal ? format(new Date(dateVal), 'yyyy-MM-dd') : '');
    await updateTask.mutateAsync({ startDate: dateVal });
    // No toast — only Save Changes fires a toast
  };

  // Create-mode: handle form submission
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) return toast.error('Task title is required');
    const payload = {
      title: createForm.title.trim(),
      description: createForm.description,
      status: createForm.status,
      priority: createForm.priority,
      projectId: context?.projectId,
      workspaceId: context?.workspaceId || workspaceId,
    };
    if (createForm.assigneeId) payload.assigneeId = createForm.assigneeId;
    if (createForm.dueDate) payload.dueDate = createForm.dueDate;
    if (createForm.startDate) payload.startDate = createForm.startDate;
    await createTask.mutateAsync(payload);
    onClose();
  };

  const handleSaveAll = async () => {
    try {
      const payload = {
        title: titleVal.trim(),
        description: descVal,
        dueDate: dueDateVal ? new Date(dueDateVal).toISOString() : null,
        startDate: startDateVal ? new Date(startDateVal).toISOString() : null,
      };
      await updateTask.mutateAsync(payload);
      toast.success('Task saved successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to save task');
    }
  };

  const handleDelete = async () => {
    await deleteTask.mutateAsync(taskId);
    setShowDeleteConfirm(false);
    onClose();
  };

  const dueDateColor = () => {
    if (!task?.dueDate) return 'var(--text-sec)';
    if (isPast(new Date(task.dueDate)) && task.status !== 'done') return 'var(--danger)';
    return 'var(--text)';
  };

  const toggleStatusDrop = () => {
    setShowStatusDrop(v => !v);
    setShowPriorityDrop(false);
    setShowAssigneeDrop(false);
  };

  const togglePriorityDrop = () => {
    setShowPriorityDrop(v => !v);
    setShowStatusDrop(false);
    setShowAssigneeDrop(false);
  };

  const toggleAssigneeDrop = () => {
    setShowAssigneeDrop(v => !v);
    setShowStatusDrop(false);
    setShowPriorityDrop(false);
  };

  if (!isOpen) return null;

  // ─── Create Mode ──────────────────────────────────────────────────
  if (mode === 'create') {
    return (
      <>
        {/* Add Status inline modal for create mode */}
        {showAddStatusModal && (
          <Modal isOpen={true} onClose={() => setShowAddStatusModal(false)}>
            <form onSubmit={handleAddStatusSubmit} style={{ padding: 24, width: '100%', maxWidth: 340, boxSizing: 'border-box' }}>
              <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>✨ Add Project Status</h3>
              <div style={{ marginBottom: 12 }}>
                <label className="section-label">Status Name</label>
                <input className="input" autoFocus value={newStatusLabel} onChange={e => setNewStatusLabel(e.target.value)} placeholder="e.g. QA Testing" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="section-label">Color</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewStatusColor(c)}
                      style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: newStatusColor === c ? '2px solid #fff' : 'none', boxShadow: newStatusColor === c ? `0 0 0 1px ${c}` : 'none' }} />
                  ))}
                </div>
              </div>
              <div className="confirm-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddStatusModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={addCustomStatus.isPending || !newStatusLabel.trim()}>
                  {addCustomStatus.isPending ? <span className="spinner-sm" /> : '+ Add'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        <Modal isOpen={isOpen} onClose={onClose} className="task-modal">
          {/* Header */}
          <div className="task-modal-header">
            <StatusBadge status={createForm.status} /
            >
            <PriorityBadge priority={createForm.priority} />
            <span style={{ fontSize: 11, color: 'var(--text-mute)', marginLeft: 4 }}>New Task</span>
            <button className="btn-icon" onClick={onClose} style={{ marginLeft: 'auto', padding: '4px 8px' }}>✕</button>
          </div>

          {/* Body */}
          <div className="task-modal-body">
            {/* Left column */}
            <div className="task-modal-left">
              {/* Title */}
              <div style={{ marginBottom: 14 }}>
                <textarea
                  className="task-modal-title"
                  value={createForm.title}
                  onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Task title..."
                  style={{ background: 'var(--s2)', padding: 6, borderRadius: 6, resize: 'none', width: '100%', border: '1px solid var(--yellow)' }}
                  rows={2}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="section-label" style={{ marginBottom: 6 }}>Description</div>
              <textarea
                className="desc-area"
                value={createForm.description}
                onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Add a description..."
                style={{ marginBottom: 16 }}
              />

              {/* Project Custom Statuses */}
              <div className="section-label" style={{ marginBottom: 8 }}>Project Statuses</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, alignItems: 'center' }}>
                {customStatuses.map(cs => (
                  <span key={cs.id} style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: `${cs.color}22`, color: cs.color, border: `1px solid ${cs.color}44`,
                  }}>{cs.label}</span>
                ))}
                {customStatuses.length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>No custom statuses yet</span>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddStatusModal(true)}
                  style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: 'var(--s2)', color: 'var(--text-mute)', border: '1px dashed var(--border)',
                    cursor: 'pointer', transition: 'var(--transition)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--yellow)'; e.currentTarget.style.color = 'var(--yellow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-mute)'; }}
                >+ Add Status</button>
              </div>
            </div>

            {/* Right column */}
            <div className="task-modal-right">
              {/* Assignee */}
              <div className="field-row">
                <div className="section-label">Assignee</div>
                <select
                  className="input"
                  style={{ fontSize: 12 }}
                  value={createForm.assigneeId}
                  onChange={e => setCreateForm(p => ({ ...p, assigneeId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>

              {/* Due Date */}
              <div className="field-row">
                <div className="section-label">Due date</div>
                <CustomDatePicker
                  value={createForm.dueDate}
                  onChange={v => setCreateForm(p => ({ ...p, dueDate: v }))}
                />
              </div>

              {/* Start Date */}
              <div className="field-row">
                <div className="section-label">Start date</div>
                <CustomDatePicker
                  value={createForm.startDate}
                  onChange={v => setCreateForm(p => ({ ...p, startDate: v }))}
                />
              </div>

              {/* Priority */}
              <div className="field-row">
                <div className="section-label">Priority</div>
                <select
                  className="input"
                  style={{ fontSize: 12 }}
                  value={createForm.priority}
                  onChange={e => setCreateForm(p => ({ ...p, priority: e.target.value }))}
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>

              {/* Status */}
              <div className="field-row">
                <div className="section-label">Status</div>
                <select
                  className="input"
                  style={{ fontSize: 12 }}
                  value={createForm.status}
                  onChange={e => setCreateForm(p => ({ ...p, status: e.target.value }))}
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>
                      {customStatuses.find(cs => cs.id === s)?.label || s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <hr className="divider" />

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreate}
                  disabled={createTask.isPending || !createForm.title.trim()}
                  style={{ background: 'var(--yellow)', color: 'var(--dark)', fontWeight: 700 }}
                >
                  {createTask.isPending ? <span className="spinner-sm" /> : '✨ Create Task'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="task-modal">
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div className="task-modal-header">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />

              {/* Project + task ref */}
              {task.projectId && (
                <span style={{ fontSize: 11, color: 'var(--text-mute)', marginLeft: 4 }}>
                  {task.projectId?.name}
                </span>
              )}

              <button className="btn-icon" onClick={onClose} style={{ marginLeft: 'auto', padding: '4px 8px' }}>✕</button>
            </div>

            {/* Body */}
            <div className="task-modal-body">
              {/* Left column */}
              <div className="task-modal-left">
                {/* Editable Title */}
                <div style={{ marginBottom: 14, position: 'relative' }}>
                  {titleEdit ? (
                    <textarea
                      ref={titleRef}
                      className="task-modal-title"
                      value={titleVal}
                      onChange={e => setTitleVal(e.target.value)}
                      onBlur={handleTitleBlur}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleTitleBlur(); } }}
                      style={{ background: 'var(--s2)', padding: 6, borderRadius: 6, resize: 'none', width: '100%', border: '1px solid var(--yellow)' }}
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <h2 className="task-modal-title" onClick={() => setTitleEdit(true)}>
                      {task.title}
                    </h2>
                  )}
                  {titleSaving && <span className="spinner-sm" style={{ position: 'absolute', right: 0, top: 4 }} />}
                  {titleSaved && <span style={{ position: 'absolute', right: 0, top: 4, color: 'var(--success)', fontSize: 14 }}>✓</span>}
                </div>

                {/* Description */}
                <div className="section-label" style={{ marginBottom: 6 }}>Description</div>
                <textarea
                  className="desc-area"
                  value={descVal}
                  onChange={e => setDescVal(e.target.value)}
                  onBlur={handleDescBlur}
                  placeholder="Add a description..."
                  style={{ marginBottom: 16 }}
                />

                {/* Project Custom Statuses (replaces Sub-status) */}
                <div className="section-label" style={{ marginBottom: 8 }}>Project Statuses</div>

                {/* Inline Add Status form */}
                {showAddStatusModal && (
                  <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-sec)' }}>New Project Status</div>
                    <input
                      className="input"
                      autoFocus
                      placeholder="Status name..."
                      value={newStatusLabel}
                      onChange={e => setNewStatusLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Escape') setShowAddStatusModal(false); }}
                      style={{ marginBottom: 8, fontSize: 12 }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                      {PRESET_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setNewStatusColor(c)}
                          style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: newStatusColor === c ? '2px solid #fff' : 'none', boxShadow: newStatusColor === c ? `0 0 0 1px ${c}` : 'none' }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-primary btn-sm" style={{ fontSize: 11 }}
                        disabled={addCustomStatus.isPending || !newStatusLabel.trim()}
                        onClick={handleAddStatusSubmit}>
                        {addCustomStatus.isPending ? <span className="spinner-sm" /> : '+ Add'}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => { setShowAddStatusModal(false); setNewStatusLabel(''); }}>Cancel</button>
                    </div>
                  </div>
                )}

                <div className="substatus-chips" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                  {customStatuses.map(cs => (
                    <span key={cs.id} style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: `${cs.color}22`, color: cs.color, border: `1px solid ${cs.color}44`,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cs.color, display: 'inline-block' }} />
                      {cs.label}
                    </span>
                  ))}
                  {customStatuses.length === 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>No custom statuses yet</span>
                  )}
                  {!showAddStatusModal && (
                    <button
                      className="substatus-chip"
                      onClick={() => { setShowAddStatusModal(true); setNewStatusLabel(''); setNewStatusColor('#6366f1'); }}
                      style={{ border: '1px dashed var(--border)' }}
                    >+ Add Status</button>
                  )}
                </div>

                <hr className="divider" />

                {/* Comments */}
                <div className="section-label">Comments ({comments.length})</div>
                <div className="comment-list" style={{ marginBottom: 12 }}>
                  {comments.map(c => (
                    <div key={c._id} className="comment-item">
                      <Avatar user={c.userId} size="sm" />
                      <div className="comment-body">
                        <div className="comment-meta">
                          <strong>{c.userId?.name}</strong>
                          {' · '}
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          {c.editedAt && <span style={{ color: 'var(--text-mute)', fontSize: 10 }}> (edited)</span>}
                        </div>
                        <div className="comment-text">{c.body}</div>
                      </div>
                      {(c.userId?._id === user?._id || user?.role === 'admin') && (
                        <button className="btn-ghost btn" style={{ fontSize: 11, padding: '2px 6px', alignSelf: 'flex-start', opacity: 0.6 }}
                          onClick={() => deleteComment.mutate({ commentId: c._id, taskId })}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add comment */}
                <form onSubmit={handleComment} className="comment-input-row">
                  <Avatar user={user} size="sm" />
                  <input
                    className="comment-input"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button type="submit" className="send-btn" disabled={createComment.isPending}>
                    {createComment.isPending ? <span className="spinner-sm" /> : '➤'}
                  </button>
                </form>

                <hr className="divider" />

                {/* Activity */}
                <div className="section-label" style={{ marginBottom: 8 }}>Activity</div>
                <div className="activity-list">
                  {activityLogs.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>No activity yet.</div>
                  ) : (
                    activityLogs.slice(0, 8).map((log, i) => (
                      <div key={i} className="activity-row">
                        <span className="activity-dot" />
                        {log.actorId?.name} {log.action}
                        {' · '}
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="task-modal-right">
                {/* Assignee */}
                <div className="field-row">
                  <div className="section-label">Assignee</div>
                  <div ref={assigneeRef} style={{ position: 'relative' }}>
                    <div className="field-val" onClick={toggleAssigneeDrop}>
                      {task.assigneeId ? (
                        <>
                          <Avatar user={task.assigneeId} size="sm" />
                          <span>{task.assigneeId.name}</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-mute)' }}>Unassigned</span>
                      )}
                    </div>
                    {showAssigneeDrop && (
                      <div className="dropdown" style={{ left: 0, top: 32, zIndex: 400 }}>
                        <div className="dropdown-item" onClick={() => handleAssign(null)}>
                          <span style={{ color: 'var(--text-mute)' }}>Unassign</span>
                        </div>
                        {members.map(m => (
                          <div key={m._id} className="dropdown-item" onClick={() => handleAssign(m._id)}>
                            <Avatar user={m} size="sm" />
                            <span>{m.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Due Date */}
                <div className="field-row">
                  <div className="section-label">Due date</div>
                  <CustomDatePicker
                    value={task.dueDate}
                    onChange={handleDueDateChange}
                  />
                </div>

                {/* Start Date */}
                <div className="field-row">
                  <div className="section-label">Start date</div>
                  <CustomDatePicker
                    value={task.startDate}
                    onChange={handleStartDateChange}
                  />
                </div>

                {/* Project */}
                <div className="field-row">
                  <div className="section-label">Project</div>
                  <div className="field-val">
                    {task.projectId && (
                      <>
                        <ProjectAvatar project={task.projectId} size="sm" />
                        <span>{task.projectId.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="field-row">
                  <div className="section-label">Priority</div>
                  <div ref={priorityRef} style={{ position: 'relative' }}>
                    <div className="field-val" onClick={togglePriorityDrop} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <PriorityBadge priority={task.priority} />
                      <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: 6 }}>▼</span>
                    </div>
                    {showPriorityDrop && (
                      <div className="dropdown" style={{ left: 0, top: 32, zIndex: 400 }}>
                        {PRIORITIES.map(p => (
                          <div key={p} className="dropdown-item" onClick={() => handlePriority(p)}>
                            <PriorityBadge priority={p} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="field-row">
                  <div className="section-label">Status</div>
                  <div ref={statusRef} style={{ position: 'relative' }}>
                    <div className="field-val" onClick={toggleStatusDrop} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <StatusBadge status={task.status} />
                      <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: 6 }}>▼</span>
                    </div>
                    {showStatusDrop && (
                      <div className="dropdown" style={{ left: 0, top: 32, zIndex: 400 }}>
                        {ALL_STATUSES.map(s => (
                          <div key={s} className={`dropdown-item ${task.status === s ? 'active' : ''}`}
                            onClick={() => handleStatus(s)}>
                            {customStatuses.find(cs => cs.id === s)
                              ? <span style={{ display:'flex', alignItems:'center', gap: 6 }}>
                                  <span style={{ width: 8, height: 8, borderRadius:'50%', background: customStatuses.find(cs=>cs.id===s)?.color, display:'inline-block' }} />
                                  {customStatuses.find(cs => cs.id === s)?.label}
                                </span>
                              : <StatusBadge status={s} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <hr className="divider" />

                {/* Created by */}
                <div className="field-row">
                  <div className="section-label">Created by</div>
                  <div className="field-val" style={{ cursor: 'default' }}>
                    <Avatar user={task.createdBy} size="sm" />
                    <span style={{ color: 'var(--text-sec)', fontSize: 12 }}>{task.createdBy?.name}</span>
                  </div>
                </div>

                {/* Created at */}
                <div className="field-row">
                  <div className="section-label">Created</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mute)', paddingLeft: 6 }}>
                    {task.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : ''}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
                  <button className="btn btn-primary" onClick={handleSaveAll} disabled={updateTask.isPending}
                    style={{ background: 'var(--yellow)', color: 'var(--dark)', fontWeight: 700 }}>
                    {updateTask.isPending ? <span className="spinner-sm" /> : '💾 Save Changes'}
                  </button>
                  <button 
                    ref={reassignBtnRef}
                    className="btn btn-outline" 
                    style={{ borderColor: 'var(--yellow)', color: 'var(--yellow)' }}
                    onClick={() => { setShowAssigneeDrop(true); setShowStatusDrop(false); setShowPriorityDrop(false); }}
                  >
                    👤 Reassign
                  </button>
                  <button className="btn btn-outline-danger" onClick={() => setShowDeleteConfirm(true)}>
                    🗑 Delete task
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-mute)' }}>Task not found.</div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete task?"
        message="This action is permanent and cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteTask.isPending}
      />
    </>
  );
}
