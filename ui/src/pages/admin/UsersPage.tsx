import {
  Alert,
  Anchor,
  Avatar,
  Card,
  Container,
  Group,
  Pagination,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconSearch } from '../../icons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { useMe } from '../../api/auth'
import { errorCode } from '../../api/client'
import { type AdminUserView, assignableRoles, canManage, type Role, ROLES } from '../../api/types'
import { useUpdateUser, useUserList } from '../../api/users'
import { formatDate, formatDateTime, initials } from '../../format'

const PAGE_SIZE = 20

export function UsersPage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const [search, setSearch] = useState('')
  const [q] = useDebouncedValue(search.trim(), 300)
  const [role, setRole] = useState<Role | null>(null)
  const [page, setPage] = useState(1)
  const list = useUserList({ q, role, page, pageSize: PAGE_SIZE })
  const update = useUpdateUser()

  const roleOptions = ROLES.map((r) => ({ value: r, label: t(`role.${r}`) }))

  const save = (user: AdminUserView, change: { role?: Role; is_active?: boolean }) =>
    update.mutate(
      { id: user.id, ...change },
      {
        onSuccess: () => notifications.show({ color: 'green', message: t('adminUsers.saved', { name: user.username }) }),
        onError: (e) => notifications.show({ color: 'red', message: t(`errors.${errorCode(e)}`) }),
      },
    )

  const total = list.data?.total ?? 0
  const rows = list.data?.items.map((user) => {
    const isSelf = user.id === me?.id
    // Read-only rows: yourself, and anyone ranked at or above you (superadmins only change from the terminal).
    const editable = !!me && !isSelf && canManage(me.role, user.role)
    const options = me ? assignableRoles(me.role).map((r) => ({ value: r, label: t(`role.${r}`) })) : []
    return (
      <Table.Tr key={user.id} opacity={user.is_active ? 1 : 0.55}>
        <Table.Td>
          <Group gap="sm" wrap="nowrap">
            <Avatar color="indigo" radius="xl" size={32}>
              {initials(user.display_name)}
            </Avatar>
            <div>
              <Anchor component={Link} to={`/users/${user.username}`} size="sm" fw={500}>
                {user.display_name}
              </Anchor>
              <Text size="xs" c="dimmed">
                @{user.username}
                {isSelf && ` (${t('adminUsers.you')})`}
              </Text>
            </div>
          </Group>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{user.email}</Text>
        </Table.Td>
        <Table.Td>
          <Select
            size="xs"
            w={150}
            // A locked row still shows its current role, even one the viewer cannot grant.
            data={editable ? options : [{ value: user.role, label: t(`role.${user.role}`) }]}
            value={user.role}
            allowDeselect={false}
            disabled={!editable}
            onChange={(value) => value && value !== user.role && save(user, { role: value as Role })}
            aria-label={t('adminUsers.colRole')}
          />
        </Table.Td>
        <Table.Td>
          <Switch
            checked={user.is_active}
            disabled={!editable}
            onChange={(e) => save(user, { is_active: e.currentTarget.checked })}
            aria-label={t('adminUsers.colActive')}
          />
        </Table.Td>
        <Table.Td>
          <Text size="sm">{formatDate(user.created_at)}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c={user.last_login_at ? undefined : 'dimmed'}>
            {user.last_login_at ? formatDateTime(user.last_login_at) : t('adminUsers.never')}
          </Text>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <Container size="lg" py="xl">
      <Stack>
        <Group justify="space-between" align="flex-end">
          <Title order={2}>{t('adminUsers.title')}</Title>
          {list.data && (
            <Text size="sm" c="dimmed">
              {t('adminUsers.total', { count: total })}
            </Text>
          )}
        </Group>

        <Group grow preventGrowOverflow={false} wrap="wrap">
          <TextInput
            placeholder={t('adminUsers.search')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value)
              setPage(1)
            }}
            miw={260}
          />
          <Select
            placeholder={t('adminUsers.allRoles')}
            data={roleOptions}
            value={role}
            clearable
            onChange={(value) => {
              setRole(value as Role | null)
              setPage(1)
            }}
            maw={220}
          />
        </Group>

        {list.isError && (
          <Alert color="red" icon={<IconAlertCircle size={18} />}>
            {t(`errors.${errorCode(list.error)}`)}
          </Alert>
        )}

        <Card withBorder padding={0}>
          <Table.ScrollContainer minWidth={820}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('adminUsers.colUser')}</Table.Th>
                  <Table.Th>{t('adminUsers.colEmail')}</Table.Th>
                  <Table.Th>{t('adminUsers.colRole')}</Table.Th>
                  <Table.Th>{t('adminUsers.colActive')}</Table.Th>
                  <Table.Th>{t('adminUsers.colJoined')}</Table.Th>
                  <Table.Th>{t('adminUsers.colLastLogin')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {list.isPending ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed" py="md">
                        {t('common.loading')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : rows && rows.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" c="dimmed" py="md">
                        {t('adminUsers.empty')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>

        {total > PAGE_SIZE && (
          <Group justify="center">
            <Pagination value={page} onChange={setPage} total={Math.ceil(total / PAGE_SIZE)} />
          </Group>
        )}
      </Stack>
    </Container>
  )
}
