import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useLogout } from '../../hooks/useAuth.js';
import { useNotifications, useMarkAllRead } from '../../hooks/useNotifications.js';
import { useUIStore } from '../../stores/uiStore.js';
import Avatar from '../ui/Avatar.jsx';
import { formatDistanceToNow } from 'date-fns';

function getBreadcrumb(pathname) {
  if (pathname === '/') return 'Home';
  if (pathname === '/tasks') return 'My Tasks';
  if (pathname === '/members') return 'Members';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/profile') return 'Profile';
  if (pathname.startsWith('/projects/')) return 'Project';
  return '';
}

export default function Topbar({ workspaceName = 'Workspace' }) {
  const { user } = useAuth();
  const logout = useLogout();
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const location = useLocation();
  const navigate = useNavigate();

  const { data: notifData } = useNotifications();
  const markAllRead = useMarkAllRead();
  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const page = getBreadcrumb(location.pathname);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header className={`topbar ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Collapse toggle for mobile */}
        <button className="btn-icon" onClick={toggleSidebar} style={{ display: 'flex' }} title="Toggle sidebar">
          ☰
        </button>

        {/* Breadcrumb */}
        <div className="breadcrumb">
          {workspaceName} / <span>{page}</span>
        </div>

        {/* Search trigger */}
        <div className="search-trigger" onClick={() => setShowSearch(true)}>
          <span style={{ fontSize: 13 }}>🔍</span>
          <span>Search tasks, projects...</span>
          <span className="search-shortcut">⌘K</span>
        </div>

        <div className="topbar-right">
          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button className="notif-bell" onClick={() => { setShowNotifs(v => !v); setShowUserMenu(false); }}>
              🔔
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>
            {showNotifs && (
              <div className="dropdown" style={{ right: 0, top: 40, width: 320 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 8px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 6px' }} onClick={() => markAllRead.mutate()}>
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px 10px', fontSize: 12, color: 'var(--text-mute)', textAlign: 'center' }}>All caught up! 🎉</div>
                ) : (
                  notifications.slice(0, 8).map(n => (
                    <div key={n._id} className="dropdown-item" style={{ gap: 10, alignItems: 'flex-start' }}
                      onClick={() => { n.link && navigate(n.link); setShowNotifs(false); }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.isRead ? 'transparent' : 'var(--yellow)', marginTop: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: n.isRead ? 'var(--text-sec)' : 'var(--text)', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User avatar + dropdown */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => { setShowUserMenu(v => !v); setShowNotifs(false); }}>
              <Avatar user={user} size="md" />
            </button>
            {showUserMenu && (
              <div className="dropdown" style={{ right: 0, top: 40, width: 180 }}>
                <div style={{ padding: '8px 10px 6px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{user?.email}</div>
                </div>
                <div className="dropdown-item" onClick={() => { navigate('/profile'); setShowUserMenu(false); }}>
                  👤 Profile
                </div>
                <div className="dropdown-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                  ⚙ Settings
                </div>
                <hr className="divider" style={{ margin: '4px 0' }} />
                <div className="dropdown-item danger" onClick={() => logout.mutate()}>
                  ⎋ Sign out
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  );
}

function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const el = document.getElementById('global-search-input');
    el?.focus();
  }, []);

  return (
    <div className="search-modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal-box">
        <div className="search-input-wrap">
          <span style={{ color: 'var(--text-mute)', fontSize: 16 }}>🔍</span>
          <input
            id="global-search-input"
            placeholder="Search tasks, projects, members..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          <span style={{ fontSize: 11, color: 'var(--text-mute)', background: 'var(--s2)', padding: '2px 6px', borderRadius: 4 }}>ESC</span>
        </div>
        {!query && (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-mute)' }}>
            Start typing to search...
          </div>
        )}
        {query && (
          <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-mute)', textAlign: 'center' }}>
            No results for "<span style={{ color: 'var(--text)' }}>{query}</span>"
          </div>
        )}
      </div>
    </div>
  );
}
