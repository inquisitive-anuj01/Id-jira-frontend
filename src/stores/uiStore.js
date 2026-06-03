import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth > 1024 : true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  openSidebar: () => set({ sidebarOpen: true }),

  // Task Modal (global — accessible from anywhere)
  taskModalOpen: false,
  selectedTaskId: null,
  taskModalMode: 'view',          // 'view' | 'create'
  taskModalContext: null,          // { projectId, workspaceId, initialStatus }
  openTaskModal: (taskId, ctx) => set({
    taskModalOpen: true,
    selectedTaskId: taskId || null,
    taskModalMode: taskId ? 'view' : 'create',
    taskModalContext: ctx || null,
  }),
  closeTaskModal: () => set({
    taskModalOpen: false,
    selectedTaskId: null,
    taskModalMode: 'view',
    taskModalContext: null,
  }),

  // Confirm Dialog (global)
  confirmDialog: null,
  openConfirmDialog: (opts) => set({ confirmDialog: opts }),
  closeConfirmDialog: () => set({ confirmDialog: null }),
}));

