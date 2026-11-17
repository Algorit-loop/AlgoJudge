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
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import { useMe } from '../../api/auth'
import { useCatalog } from '../../api/catalog'
import { errorCode } from '../../api/client'
import { type ProblemListParams, useProblemList } from '../../api/problems'
import { canCreateProblems } from '../../api/types'
import { IconAlertCircle, IconLock, IconPlus, IconSearch } from '../../icons'

const PAGE_SIZE = 50
type Sort = NonNullable<ProblemListParams['sort']>
const pointsFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

export function ProblemListPage() {
  const { t } = useTranslation()
  const { data: me } = useMe()
  // Filters live in the URL so they survive reloads and can be linked to (e.g. from a problem's type badge).
  const [params, setParams] = useSearchParams()
  const group = params.get('group')
  const type = params.get('type')
  const sort = (['code', 'newest', 'points'].includes(params.get('sort') ?? '') ? params.get('sort') : 'code') as Sort
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [q] = useDebouncedValue(search.trim(), 300)
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [page, setPage] = useState(1)
  const canCreate = !!me && canCreateProblems(me.role)
  const groups = useCatalog('problem-groups')
  const types = useCatalog('problem-types')
  const list = useProblemList({ q, group, type, sort, mine: canCreate && scope === 'mine', page, pageSize: PAGE_SIZE })
  const total = list.data?.total ?? 0

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setPage(1)
  }

  const sortHeader = (key: Sort, label: string) => (
    <UnstyledButton onClick={() => setParam('sort', key === 'code' ? null : key)} fw={sort === key ? 700 : 600} fz="sm">
      {label}
      {sort === key ? ' ↓' : ''}
    </UnstyledButton>
  )

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
            miw={220}
          />
          <Select
            placeholder={t('problems.allGroups')}
            data={(groups.data ?? []).map((x) => ({ value: x.slug, label: x.name }))}
            value={group}
            onChange={(v) => setParam('group', v)}
            clearable
            searchable
            w={190}
          />
          <Select
            placeholder={t('problems.allTypes')}
            data={(types.data ?? []).map((x) => ({ value: x.slug, label: x.name }))}
            value={type}
            onChange={(v) => setParam('type', v)}
            clearable
            searchable
            w={190}
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
          <Table.ScrollContainer minWidth={720}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={150}>{sortHeader('code', t('problems.colCode'))}</Table.Th>
                  <Table.Th>{t('problems.colTitle')}</Table.Th>
                  <Table.Th w={170}>{t('problems.group')}</Table.Th>
                  <Table.Th w={90} ta="right">
                    {sortHeader('points', t('problems.points'))}
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
                        <Group gap={6}>
                          <Anchor component={Link} to={`/problems/${p.code}`} fw={500}>
                            {p.title}
                          </Anchor>
                          {p.visibility === 'private' && (
                            <Badge size="xs" variant="light" color="yellow" leftSection={<IconLock size={10} />}>
                              {t('problems.private')}
                            </Badge>
                          )}
                          {p.types.map((x) => (
                            <Badge
                              key={x.id}
                              size="xs"
                              variant="outline"
                              color="gray"
                              tt="none"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setParam('type', x.slug)}
                            >
                              {x.name}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {p.group && (
                          <Anchor size="sm" c="dimmed" onClick={() => setParam('group', p.group?.slug ?? null)}>
                            {p.group.name}
                          </Anchor>
                        )}
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm" fw={500}>
                          {pointsFormat.format(p.points)}
                          {p.scoring_mode === 'partial' && (
                            <Text span c="dimmed" size="xs" title={t('problems.scoring.partial')}>
                              {' '}p
                            </Text>
                          )}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" c="dimmed" py="md">
                        {q || group || type ? t('problems.noMatch') : t('problems.empty')}
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
