import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from './client'
import type { Me } from './types'

const ME_KEY = ['auth', 'me'] as const

/** The logged-in user, or null. */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => (await api<{ user: Me | null }>('/auth/me')).user,
    staleTime: 60_000,
  })
}

export function useRegistrationInfo() {
  return useQuery({
    queryKey: ['auth', 'registration'],
    queryFn: () => api<{ registration_open: boolean }>('/auth/registration'),
    staleTime: Infinity,
  })
}

export interface LoginInput {
  login: string
  password: string
  remember: boolean
}

export interface RegisterInput {
  username: string
  email: string
  password: string
  display_name?: string
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => api<Me>('/auth/login', { method: 'POST', body: input }),
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterInput) => api<Me>('/auth/register', { method: 'POST', body: input }),
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      // Drop every cached query: other users' data must not survive a logout.
      qc.clear()
      qc.setQueryData(ME_KEY, null)
    },
  })
}
