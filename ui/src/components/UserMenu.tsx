import { Avatar, Group, Menu, Text, UnstyledButton } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconChevronDown, IconLogout, IconUser, IconUsers } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { useLogout } from '../api/auth'
import { isAdmin, type Me } from '../api/types'
import { initials } from '../format'
import { RoleBadge } from './RoleBadge'

export function UserMenu({ user }: { user: Me }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useLogout()

  const onLogout = () =>
    logout.mutate(undefined, {
      onSuccess: () => {
        notifications.show({ message: t('auth.loggedOut') })
        void navigate('/')
      },
    })

  return (
    <Menu position="bottom-end" width={240} withArrow>
      <Menu.Target>
        <UnstyledButton aria-label={user.display_name}>
          <Group gap={8} wrap="nowrap">
            <Avatar color="indigo" radius="xl" size={32}>
              {initials(user.display_name)}
            </Avatar>
            <Text size="sm" fw={500} visibleFrom="sm" maw={160} truncate>
              {user.display_name}
            </Text>
            <IconChevronDown size={14} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>
          <Text size="sm" fw={600} c="var(--mantine-color-text)" truncate>
            {user.display_name}
          </Text>
          <Group gap={6} mt={4}>
            <Text size="xs" c="dimmed">
              @{user.username}
            </Text>
            <RoleBadge role={user.role} />
          </Group>
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item component={Link} to={`/users/${user.username}`} leftSection={<IconUser size={16} />}>
          {t('nav.profile')}
        </Menu.Item>
        {isAdmin(user.role) && (
          <Menu.Item component={Link} to="/admin/users" leftSection={<IconUsers size={16} />}>
            {t('nav.adminUsers')}
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={onLogout} disabled={logout.isPending}>
          {t('nav.logout')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
