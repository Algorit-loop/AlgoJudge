import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { CatalogItem, Language } from './types'

export type CatalogKind = 'problem-types' | 'problem-groups'

export function useLanguages(includeDisabled = false) {
  return useQuery({
    queryKey: ['catalog', 'languages', includeDisabled],
    queryFn: () => api<Language[]>(`/languages${includeDisabled ? '?include_disabled=true' : ''}`),
    staleTime: 5 * 60_000,
  })
}

export function useCatalog(kind: CatalogKind) {
  return useQuery({
    queryKey: ['catalog', kind],
    queryFn: () => api<CatalogItem[]>(`/${kind}`),
    staleTime: 5 * 60_000,
  })
}

export function useUpdateLanguage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, ...body }: { key: string; name?: string; is_enabled?: boolean; sort_order?: number }) =>
      api<Language>(`/languages/${encodeURIComponent(key)}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', 'languages'] }),
  })
}

export function useCatalogMutations(kind: CatalogKind) {
  const qc = useQueryClient()
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['catalog', kind] })
    void qc.invalidateQueries({ queryKey: ['problems'] })
  }
  return {
    create: useMutation({
      mutationFn: (body: { slug: string; name: string }) => api<CatalogItem>(`/${kind}`, { method: 'POST', body }),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: number; slug?: string; name?: string }) =>
        api<CatalogItem>(`/${kind}/${id}`, { method: 'PATCH', body }),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api<void>(`/${kind}/${id}`, { method: 'DELETE' }),
      onSuccess: refresh,
    }),
  }
}
