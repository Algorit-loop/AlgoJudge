import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { AdminUserView, PublicUser, Role } from './types'

export interface UserListParams {
  q: string
  role: Role | null
  page: number
  pageSize: number
}

export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => {
      const search = new URLSearchParams({ page: String(params.page), page_size: String(params.pageSize) })
      if (params.q) search.set('q', params.q)
      if (params.role) search.set('role', params.role)
      return api<{ items: AdminUserView[]; total: number }>(`/users?${search}`)
    },
    placeholderData: keepPreviousData,
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; role?: Role; is_active?: boolean }) =>
      api<AdminUserView>(`/users/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function usePublicUser(username: string) {
  return useQuery({
    queryKey: ['users', 'public', username.toLowerCase()],
    queryFn: () => api<PublicUser>(`/users/by-username/${encodeURIComponent(username)}`),
    retry: false,
  })
}
