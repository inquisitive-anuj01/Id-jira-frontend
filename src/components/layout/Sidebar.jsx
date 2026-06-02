import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useProjects } from '../../hooks/useProjects.js';
import { useCreateProject } from '../../hooks/useProjects.js';
import { useUIStore } from '../../stores/uiStore.js';
import Avatar, { ProjectAvatar } from '../ui/Avatar.jsx';
import Modal from '../ui/Modal.jsx';

const NAV_ITEMS = [
  { path: '/',        label: 'Home',     icon: '⌂',  exact: true },
  { path: '/tasks',   label: 'My Tasks', icon: '✓' },
  { path: '/members', label: 'Members',  icon: '👥' },
  { path: '/settings',label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const closeSidebar = useUIStore(s => s.closeSidebar);
  const workspaceId = user?.workspaceId?._id || user?.workspaceId;
  const { data: projects = [] } = useProjects(workspaceId);
  const createProject = useCreateProject();
  const navigate = useNavigate();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const proj = await createProject.mutateAsync({
      name: newProjName.trim(),
      workspaceId,
    });
    setNewProjName('');
    setShowNewProject(false);
    navigate(`/projects/${proj._id}`);
  };

  const workspaceName = user?.workspaceId?.name || user?.workspace?.name || 'Workspace';

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : 'collapsed'}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">N</div>
          {sidebarOpen && (
            <div className="logo-text">
              {workspaceName.toLowerCase().replace(/ /g, '')}<span>.</span>flow
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? item.label : ''}
              onClick={handleNavClick}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Projects */}
          {sidebarOpen && <div className="nav-section-label">Projects</div>}

          {projects.map(project => (
            <NavLink
              key={project._id}
              to={`/projects/${project._id}`}
              className={({ isActive }) => `proj-nav-item ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? project.name : ''}
              onClick={handleNavClick}
            >
              <ProjectAvatar project={project} size="sm" />
              {sidebarOpen && <span className="truncate">{project.name}</span>}
            </NavLink>
          ))}

          {/* New Project */}
          <button
            className="proj-nav-item"
            style={{ color: 'var(--text-mute)', cursor: 'pointer', width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
            onClick={() => setShowNewProject(true)}
            title={!sidebarOpen ? 'New project' : ''}
          >
            <div className="proj-avatar proj-avatar-sm" style={{ background: 'var(--s3)', color: 'var(--text-mute)' }}>+</div>
            {sidebarOpen && <span>New project</span>}
          </button>
        </nav>

        {/* User bottom */}
        <div className="sidebar-bottom">
          <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flex: 1 }} onClick={handleNavClick}>
            <Avatar user={user} size="sm" style={{ flexShrink: 0 }} />
            {sidebarOpen && (
              <div className="av-info">
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2 }}>{user?.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-sec)' }}>{user?.role}</div>
              </div>
            )}
          </NavLink>
        </div>
      </aside>

      {/* New Project Modal */}
      <Modal isOpen={showNewProject} onClose={() => setShowNewProject(false)}>
        <form onSubmit={handleCreateProject} style={{ padding: 24, width: '100%', maxWidth: 340, boxSizing: 'border-box' }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>New Project</h3>
          <input
            className="input"
            placeholder="Project name"
            value={newProjName}
            onChange={e => setNewProjName(e.target.value)}
            autoFocus
            style={{ marginBottom: 14 }}
          />
          <div className="confirm-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNewProject(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={createProject.isPending}>
              {createProject.isPending ? <span className="spinner-sm" /> : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
