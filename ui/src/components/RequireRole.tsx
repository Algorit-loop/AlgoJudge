import { Center, Loader } from '@mantine/core'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useMe } from '../api/auth'
import { isAdmin, type Role } from '../api/types'
import { MessagePage } from '../pages/MessagePage'
import { useTranslation } from 'react-i18next'

/** Render children only for a logged-in user (optionally with one of `roles`; admins and superadmins always pass). */
export function RequireRole({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { t } = useTranslation()
  const { data: me, isPending } = useMe()
  const location = useLocation()

  if (isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }
  if (!me) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (roles && !isAdmin(me.role) && !roles.includes(me.role)) {
    return <MessagePage title={t('common.forbiddenTitle')} text={t('common.forbiddenText')} code="403" />
  }
  return <>{children}</>
}
