import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { ProblemDetail, ProblemSummary, Visibility } from './types'

export interface ProblemListParams {
  q?: string
  mine?: boolean
  sort?: 'code' | 'newest'
  page?: number
  pageSize?: number
}

export function useProblemList(params: ProblemListParams) {
  return useQuery({
    queryKey: ['problems', 'list', params],
    queryFn: () => {
      const search = new URLSearchParams({
        page: String(params.page ?? 1),
        page_size: String(params.pageSize ?? 50),
        sort: params.sort ?? 'code',
      })
      if (params.q) search.set('q', params.q)
      if (params.mine) search.set('mine', 'true')
      return api<{ items: ProblemSummary[]; total: number }>(`/problems?${search}`)
    },
    placeholderData: keepPreviousData,
  })
}

export function useProblem(code: string) {
  return useQuery({
    queryKey: ['problems', 'detail', code],
    queryFn: () => api<ProblemDetail>(`/problems/${encodeURIComponent(code)}`),
    retry: false,
  })
}

export interface ProblemCreateInput {
  code: string
  title: string
  time_limit_ms: number
  memory_limit_kb: number
  statement_md?: string
}

export function useCreateProblem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProblemCreateInput) => api<ProblemDetail>('/problems', { method: 'POST', body: input }),
    onSuccess: (p) => {
      qc.setQueryData(['problems', 'detail', p.code], p)
      void qc.invalidateQueries({ queryKey: ['problems', 'list'] })
    },
  })
}

export interface ProblemUpdateInput {
  title?: string
  statement_md?: string
  time_limit_ms?: number
  memory_limit_kb?: number
  visibility?: Visibility
}

function useProblemMutation<V>(code: string, request: (vars: V) => Promise<ProblemDetail>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (p) => {
      qc.setQueryData(['problems', 'detail', code], p)
      void qc.invalidateQueries({ queryKey: ['problems', 'list'] })
    },
  })
}

export const useUpdateProblem = (code: string) =>
  useProblemMutation(code, (input: ProblemUpdateInput) =>
    api<ProblemDetail>(`/problems/${encodeURIComponent(code)}`, { method: 'PATCH', body: input }),
  )

export const useSetAuthors = (code: string) =>
  useProblemMutation(code, (usernames: string[]) =>
    api<ProblemDetail>(`/problems/${encodeURIComponent(code)}/authors`, { method: 'PUT', body: { usernames } }),
  )

export function useDeleteProblem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => api<void>(`/problems/${encodeURIComponent(code)}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['problems'] }),
  })
}

export function uploadProblemImage(code: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return api<{ url: string }>(`/problems/${encodeURIComponent(code)}/images`, { method: 'POST', body: form })
}
