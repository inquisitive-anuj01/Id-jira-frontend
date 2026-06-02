import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../lib/api.js';
import { useWorkspaceStore } from '../stores/workspaceStore.js';

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data.data.user),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  return { user, isLoading };
}

export function useLogin() {
  const qc = useQueryClient();
  const setWorkspace = useWorkspaceStore(s => s.setWorkspace);

  return useMutation({
    mutationFn: (creds) => api.post('/auth/login', creds).then(r => r.data.data),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data.user);
      if (data.user.workspace) setWorkspace(data.user.workspace);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed');
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clearWorkspace = useWorkspaceStore(s => s.clearWorkspace);

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      qc.clear();
      clearWorkspace();
      window.location.href = '/login';
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data) => api.patch('/auth/change-password', data).then(r => r.data),
    onSuccess: () => toast.success('Password changed successfully'),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const setWorkspace = useWorkspaceStore(s => s.setWorkspace);

  return useMutation({
    mutationFn: (payload) => api.post('/auth/register', payload).then(r => r.data.data),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data.user);
      if (data.user?.workspace) setWorkspace(data.user.workspace);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Registration failed');
    },
  });
}
