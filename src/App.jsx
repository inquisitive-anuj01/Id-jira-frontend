import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from './lib/api.js';
import PageLayout from './components/layout/PageLayout.jsx';
import LoginPage from './pages/Login.jsx';
import AdminPage from './pages/Admin.jsx';
import JoinPage from './pages/Join.jsx';
import HomePage from './pages/Home.jsx';
import MyTasksPage from './pages/MyTasks.jsx';
import ProjectPage from './pages/Project.jsx';
import MembersPage from './pages/Members.jsx';
import SettingsPage from './pages/Settings.jsx';
import ProfilePage from './pages/Profile.jsx';

function ProtectedRoute({ children }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data.data.user),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      </div>
    );
  }
  if (isError || !data) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/join/:inviteToken" element={<JoinPage />} />
        <Route path="/" element={<ProtectedRoute><PageLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="tasks" element={<MyTasksPage />} />
          <Route path="projects/:id" element={<ProjectPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}