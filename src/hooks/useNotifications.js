import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api.js';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
    refetchInterval: 30000, // poll every 30s
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });
}

export function useMarkOneRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });
}

export function useUsers(workspaceId, search = '') {
  return useQuery({
    queryKey: ['users', workspaceId, search],
    queryFn: () =>
      api.get('/users', { params: { workspaceId, search } }).then(r => r.data.data.users),
    enabled: !!workspaceId,
    keepPreviousData: true,
  });
}

export function useDashboard(workspaceId) {
  return useQuery({
    queryKey: ['dashboard', workspaceId],
    queryFn: () =>
      api.get('/dashboard', { params: { workspaceId } }).then(r => r.data.data),
    enabled: !!workspaceId,
    staleTime: 1000 * 60,
  });
}
