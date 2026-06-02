import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../lib/api.js';

export function useWorkspace(workspaceId) {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}`).then(r => r.data.data.workspace),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWorkspaceMembers(workspaceId) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then(r => r.data.data.members),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/workspaces', data).then(r => r.data.data.workspace),
    onSuccess: () => {
      qc.invalidateQueries(['me']);
      toast.success('Workspace created!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create workspace'),
  });
}

export function useUpdateWorkspace(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`/workspaces/${workspaceId}`, data).then(r => r.data.data.workspace),
    onSuccess: () => {
      qc.invalidateQueries(['workspace', workspaceId]);
      toast.success('Workspace updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
}

export function useResetInvite(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/workspaces/${workspaceId}/reset-invite`).then(r => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries(['workspace', workspaceId]);
      toast.success('Invite link regenerated!');
    },
  });
}

export function useUpdateMemberPermissions(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permissions, role }) =>
      api.patch(`/workspaces/${workspaceId}/members/${userId}/permissions`, { permissions, role }),
    onSuccess: () => {
      qc.invalidateQueries(['workspace-members', workspaceId]);
      toast.success('Permissions updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update permissions'),
  });
}

export function useRemoveMember(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => api.delete(`/workspaces/${workspaceId}/members/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries(['workspace-members', workspaceId]);
      toast.success('Member removed.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove member'),
  });
}

export function useCreateMember(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/workspaces/${workspaceId}/members`, data).then(r => r.data.data.user),
    onSuccess: () => {
      qc.invalidateQueries(['workspace-members', workspaceId]);
      toast.success('Member profile created successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create member');
    },
  });
}
