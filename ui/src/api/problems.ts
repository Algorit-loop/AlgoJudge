import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type {
  ProblemDetail,
  ProblemSettings,
  ProblemSummary,
  ScoringMode,
  Solution,
  SourceVisibility,
  TestcaseResultVisibility,
  TestcaseVisibility,
  Visibility,
} from './types'

export interface ProblemListParams {
  q?: string
  mine?: boolean
  group?: string | null
  type?: string | null
  sort?: 'code' | 'newest' | 'points'
  page?: number
  pageSize?: number
}

const enc = encodeURIComponent

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
      if (params.group) search.set('group', params.group)
      if (params.type) search.set('type', params.type)
      return api<{ items: ProblemSummary[]; total: number }>(`/problems?${search}`)
    },
    placeholderData: keepPreviousData,
  })
}

export function useProblem(code: string) {
  return useQuery({
    queryKey: ['problems', 'detail', code],
    queryFn: () => api<ProblemDetail>(`/problems/${enc(code)}`),
    retry: false,
  })
}

/** Editor view of a problem. Only fetched for editors. */
export function useProblemSettings(code: string) {
  return useQuery({
    queryKey: ['problems', 'settings', code],
    queryFn: () => api<ProblemSettings>(`/problems/${enc(code)}/settings`),
    retry: false,
  })
}

export function useSolution(code: string, enabled: boolean) {
  return useQuery({
    queryKey: ['problems', 'solution', code],
    queryFn: () => api<Solution>(`/problems/${enc(code)}/solution`),
    retry: false,
    enabled,
  })
}

export interface ProblemCreateInput {
  code: string
  title: string
  time_limit_ms: number
  memory_limit_kb: number
  points?: number
  scoring_mode?: ScoringMode
}

export interface ProblemUpdateInput {
  title?: string
  statement_md?: string
  time_limit_ms?: number
  memory_limit_kb?: number
  points?: number
  scoring_mode?: ScoringMode
  visibility?: Visibility
  published_at?: string | null
  group_id?: number | null
  type_ids?: number[]
  language_keys?: string[]
  source_visibility?: SourceVisibility
  testcase_visibility?: TestcaseVisibility
  testcase_result_visibility?: TestcaseResultVisibility
}

export interface MembersInput {
  creators: string[]
  curators: string[]
  testers: string[]
}

/** After any change, refresh every cached view of this problem and the lists. */
function useSettingsMutation<V>(code: string, request: (vars: V) => Promise<ProblemSettings>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (p) => {
      qc.setQueryData(['problems', 'settings', code], p)
      void qc.invalidateQueries({ queryKey: ['problems', 'detail', code] })
      void qc.invalidateQueries({ queryKey: ['problems', 'list'] })
    },
  })
}

export function useCreateProblem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProblemCreateInput) => api<ProblemSettings>('/problems', { method: 'POST', body: input }),
    onSuccess: (p) => {
      qc.setQueryData(['problems', 'settings', p.code], p)
      void qc.invalidateQueries({ queryKey: ['problems', 'list'] })
    },
  })
}

export const useUpdateProblem = (code: string) =>
  useSettingsMutation(code, (input: ProblemUpdateInput) =>
    api<ProblemSettings>(`/problems/${enc(code)}`, { method: 'PATCH', body: input }),
  )

export const useSetMembers = (code: string) =>
  useSettingsMutation(code, (input: MembersInput) =>
    api<ProblemSettings>(`/problems/${enc(code)}/members`, { method: 'PUT', body: input }),
  )

export function useSaveSolution(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { content_md: string; is_public: boolean; publish_at: string | null }) =>
      api<Solution>(`/problems/${enc(code)}/solution`, { method: 'PUT', body: input }),
    onSuccess: (s) => {
      qc.setQueryData(['problems', 'solution', code], s)
      void qc.invalidateQueries({ queryKey: ['problems', 'detail', code] })
    },
  })
}

export function useDeleteSolution(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>(`/problems/${enc(code)}/solution`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['problems', 'solution', code] })
      void qc.invalidateQueries({ queryKey: ['problems', 'detail', code] })
    },
  })
}

export function useDeleteProblem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => api<void>(`/problems/${enc(code)}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['problems'] }),
  })
}

export async function uploadProblemImage(code: string, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { url } = await api<{ url: string }>(`/problems/${enc(code)}/images`, { method: 'POST', body: form })
  return url
}
