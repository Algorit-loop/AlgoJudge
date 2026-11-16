import { Badge } from '@mantine/core'
import { useTranslation } from 'react-i18next'

import type { Role } from '../api/types'

const COLOR: Record<Role, string> = { superadmin: 'orange', admin: 'red', setter: 'grape', user: 'gray' }

export function RoleBadge({ role }: { role: Role }) {
  const { t } = useTranslation()
  return (
    <Badge color={COLOR[role]} variant="light">
      {t(`role.${role}`)}
    </Badge>
  )
}
