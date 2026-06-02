import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../lib/api.js';

export function useProjects(workspaceId) {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => api.get('/projects', { params: { workspaceId } }).then(r => r.data.data.projects),
    enabled: !!workspaceId,
  });
}

export function useProject(projectId) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data.data),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/projects', data).then(r => r.data.data.project),
    onSuccess: (project) => {
      qc.invalidateQueries(['projects', project.workspaceId]);
      toast.success(`Project "${project.name}" created!`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create project'),
  });
}

export function useUpdateProject(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`/projects/${projectId}`, data).then(r => r.data.data.project),
    onSuccess: (project) => {
      qc.invalidateQueries(['project', projectId]);
      qc.invalidateQueries(['projects', project.workspaceId]);
      toast.success('Project updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
}

export function useDeleteProject(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}`),
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      toast.success('Project deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });
}
