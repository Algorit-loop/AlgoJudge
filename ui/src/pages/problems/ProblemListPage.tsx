import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Pagination,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconAlertCircle, IconLock, IconPlus, IconSearch } from '../../icons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { useMe } from '../../api/auth'
import { errorCode } from '../../api/client'
import { useProblemList } from '../../api/problems'
import { canCreateProblems } from '../../api/types'
import { formatMegabytes, formatSeconds } from '../../format'

const PAGE_SIZE = 50

export function ProblemListPage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const [search, setSearch] = useState('')
  const [q] = useDebouncedValue(search.trim(), 300)
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [page, setPage] = useState(1)
  const canCreate = !!me && canCreateProblems(me.role)
  const list = useProblemList({ q, mine: canCreate && scope === 'mine', page, pageSize: PAGE_SIZE })
  const total = list.data?.total ?? 0

  return (
    <Container size="lg" py="xl">
      <Stack>
        <Group justify="space-between" align="flex-end">
          <Title order={2}>{t('problems.title')}</Title>
          {canCreate && (
            <Button component={Link} to="/problems/new" leftSection={<IconPlus size={16} />}>
              {t('problems.create')}
            </Button>
          )}
        </Group>

        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder={t('problems.search')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value)
              setPage(1)
            }}
            style={{ flex: 1 }}
            miw={240}
          />
          {canCreate && (
            <SegmentedControl
              value={scope}
              onChange={(v) => {
                setScope(v as 'all' | 'mine')
                setPage(1)
              }}
              data={[
                { value: 'all', label: t('problems.scopeAll') },
                { value: 'mine', label: t('problems.scopeMine') },
              ]}
            />
          )}
        </Group>

        {list.isError && (
          <Alert color="red" icon={<IconAlertCircle size={18} />}>
            {t(`errors.${errorCode(list.error)}`)}
          </Alert>
        )}

        <Card withBorder padding={0}>
          <Table.ScrollContainer minWidth={560}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={160}>{t('problems.colCode')}</Table.Th>
                  <Table.Th>{t('problems.colTitle')}</Table.Th>
                  <Table.Th w={110} ta="right">
                    {t('problems.colTime')}
                  </Table.Th>
                  <Table.Th w={120} ta="right">
                    {t('problems.colMemory')}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {list.isPending ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" c="dimmed" py="md">
                        {t('common.loading')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : list.data && list.data.items.length > 0 ? (
                  list.data.items.map((p) => (
                    <Table.Tr key={p.code}>
                      <Table.Td>
                        <Text ff="monospace" size="sm">
                          {p.code}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Anchor component={Link} to={`/problems/${p.code}`} fw={500}>
                            {p.title}
                          </Anchor>
                          {p.visibility === 'private' && (
                            <Badge size="xs" variant="light" color="yellow" leftSection={<IconLock size={10} />}>
                              {t('problems.private')}
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm">{t('problems.secondsShort', { value: formatSeconds(p.time_limit_ms) })}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm">{t('problems.megabytesShort', { value: formatMegabytes(p.memory_limit_kb) })}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" c="dimmed" py="md">
                        {q ? t('problems.noMatch') : t('problems.empty')}
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
