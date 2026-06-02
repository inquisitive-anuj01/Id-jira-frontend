import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../lib/api.js';

export function useTasks(params = {}) {
  const cleaned = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''));
  return useQuery({
    queryKey: ['tasks', cleaned],
    queryFn: () => api.get('/tasks', { params: cleaned }).then(r => r.data),
    enabled: !!(cleaned.projectId || cleaned.workspaceId || cleaned.myTasks),
    keepPreviousData: true,
  });
}

export function useTask(taskId) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then(r => r.data.data.task),
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/tasks', data).then(r => r.data.data.task),
    onSuccess: (task) => {
      qc.invalidateQueries(['tasks']);
      qc.invalidateQueries(['dashboard']);
      qc.invalidateQueries(['project', task.projectId]);
      toast.success('Task created!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create task'),
  });
}

export function useUpdateTask(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`/tasks/${taskId}`, data).then(r => r.data.data.task),
    onSuccess: (task) => {
      qc.setQueryData(['task', taskId], task);
      qc.invalidateQueries(['tasks']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries(['tasks']);
      qc.invalidateQueries(['dashboard']);
      toast.success('Task deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });
}

export function useChangeTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }) => api.patch(`/tasks/${taskId}/status`, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['tasks']);
      qc.invalidateQueries(['task', vars.taskId]);
      qc.invalidateQueries(['dashboard']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Status update failed'),
  });
}

export function useAssignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assigneeId }) => api.patch(`/tasks/${taskId}/assign`, { assigneeId }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['task', vars.taskId]);
      qc.invalidateQueries(['tasks']);
      toast.success('Task reassigned!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Assign failed'),
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tasks) => api.patch('/tasks/reorder', { tasks }),
    onSuccess: () => qc.invalidateQueries(['tasks']),
  });
}

// Comments
export function useComments(taskId) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => api.get('/comments', { params: { taskId } }).then(r => r.data.data.comments),
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/comments', data).then(r => r.data.data.comment),
    onSuccess: (comment) => qc.invalidateQueries(['comments', comment.taskId]),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add comment'),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, taskId }) => api.delete(`/comments/${commentId}`).then(() => taskId),
    onSuccess: (taskId) => qc.invalidateQueries(['comments', taskId]),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete comment'),
  });
}

// Activity logs
export function useActivityLog(taskId) {
  return useQuery({
    queryKey: ['activity', taskId],
    queryFn: () =>
      api.get('/tasks/' + taskId).then(r => r.data.data.task),
    enabled: false, // fetched inside task modal via separate mechanism
  });
}
