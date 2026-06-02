import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useUIStore } from '../../stores/uiStore.js';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import TaskModal from '../tasks/TaskModal.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';

export default function PageLayout() {
  const { user } = useAuth();
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const taskModalOpen = useUIStore(s => s.taskModalOpen);
  const closeTaskModal = useUIStore(s => s.closeTaskModal);
  const selectedTaskId = useUIStore(s => s.selectedTaskId);
  const confirmDialog = useUIStore(s => s.confirmDialog);
  const closeConfirmDialog = useUIStore(s => s.closeConfirmDialog);

  const workspaceName = user?.workspaceId?.name || user?.workspace?.name || 'Workspace';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />
      <Topbar workspaceName={workspaceName} />

      <main className={`page-layout ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="page-content page-enter">
          <Outlet />
        </div>
      </main>

      {/* Global Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        taskId={selectedTaskId}
        onClose={closeTaskModal}
      />

      {/* Global Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          onClose={closeConfirmDialog}
          onConfirm={() => {
            confirmDialog.onConfirm();
            closeConfirmDialog();
          }}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          danger={confirmDialog.danger}
        />
      )}
    </div>
  );
}
