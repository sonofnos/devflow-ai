import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Snippet } from '../types';

export function useSnippets(tag?: string) {
  return useQuery({
    queryKey: ['snippets', tag],
    queryFn: async () => {
      const { data } = await api.get<Snippet[]>('/snippets', { params: tag ? { tag } : {} });
      return data;
    },
  });
}

export function useCreateSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; language: string; code: string; tags: string[] }) =>
      api.post<Snippet>('/snippets', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['snippets'] }),
  });
}

export function useDeleteSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/snippets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['snippets'] }),
  });
}

export function useExplainSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ explanation: string }>(`/snippets/${id}/explain`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['snippets'] }),
  });
}
