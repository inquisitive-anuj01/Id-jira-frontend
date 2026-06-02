// Badge component — maps status/priority to correct style
const STATUS_MAP = {
  backlog:     { label: 'Backlog',     cls: 'badge-gray' },
  todo:        { label: 'Todo',        cls: 'badge-red' },
  in_progress: { label: 'In Progress', cls: 'badge-orange' },
  in_review:   { label: 'In Review',   cls: 'badge-teal' },
  done:        { label: 'Done',        cls: 'badge-green' },
};

const PRIORITY_MAP = {
  low:    { label: 'Low',    cls: 'badge-gray' },
  medium: { label: 'Medium', cls: 'badge-blue' },
  high:   { label: 'High',   cls: 'badge-orange' },
  urgent: { label: 'Urgent', cls: 'badge-red' },
};

const ROLE_MAP = {
  admin:    { label: 'Admin',    cls: 'badge-yellow' },
  manager:  { label: 'Manager',  cls: 'badge-purple' },
  employee: { label: 'Employee', cls: 'badge-teal' },
};

export function StatusBadge({ status, className = '' }) {
  const info = STATUS_MAP[status] || { label: status, cls: 'badge-gray' };
  return (
    <span className={`badge ${info.cls} ${className}`}>{info.label}</span>
  );
}

export function PriorityBadge({ priority, className = '' }) {
  const info = PRIORITY_MAP[priority] || { label: priority, cls: 'badge-gray' };
  const pulse = priority === 'urgent' ? 'pulse-danger' : '';
  return (
    <span className={`badge ${info.cls} ${pulse} ${className}`}>{info.label}</span>
  );
}

export function RoleBadge({ role, className = '' }) {
  const info = ROLE_MAP[role] || { label: role, cls: 'badge-gray' };
  return (
    <span className={`badge ${info.cls} ${className}`}>{info.label}</span>
  );
}

export function CountBadge({ count, yellow = false }) {
  return (
    <span className={`badge ${yellow ? 'badge-yellow' : 'badge-gray'}`}>{count}</span>
  );
}
