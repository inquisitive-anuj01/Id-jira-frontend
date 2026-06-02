// Deterministic color from string
const COLORS = ['#F4C71A', '#1D9E75', '#534AB7', '#E24B4A', '#EF9F27', '#5DCAA5', '#D85A30', '#3B82F6'];

export function getColorForStr(str = '') {
  const idx = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length;
  return COLORS[idx];
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ user, size = 'md', className = '', style = {} }) {
  const sizeClass = { sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg', xl: 'avatar-xl', '2xl': 'avatar-2xl' }[size] || 'avatar-md';
  const color = getColorForStr(user?.name || user?.email || '');
  const isDark = color === '#F4C71A' || color === '#EF9F27' || color === '#5DCAA5';

  if (user?.avatarUrl) {
    return (
      <div className={`avatar ${sizeClass} ${className}`} style={style}>
        <img src={user.avatarUrl} alt={user.name} />
      </div>
    );
  }

  return (
    <div
      className={`avatar ${sizeClass} ${className}`}
      style={{ background: color, color: isDark ? '#141414' : '#fff', ...style }}
      title={user?.name || ''}
    >
      {getInitials(user?.name || user?.email || '?')}
    </div>
  );
}

export function ProjectAvatar({ project, size = 'md', className = '' }) {
  const sizeClass = { sm: 'proj-avatar-sm', md: 'proj-avatar-md', lg: 'proj-avatar-lg', xl: 'proj-avatar-xl' }[size] || 'proj-avatar-md';
  const color = project?.color || getColorForStr(project?.name || '');
  const isDark = color === '#F4C71A' || color === '#EF9F27' || color === '#5DCAA5';

  return (
    <div
      className={`proj-avatar ${sizeClass} ${className}`}
      style={{ background: color, color: isDark ? '#141414' : '#fff' }}
    >
      {project?.icon || (project?.name?.[0] || 'P').toUpperCase()}
    </div>
  );
}
