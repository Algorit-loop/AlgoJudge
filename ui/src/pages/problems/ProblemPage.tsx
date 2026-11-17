import {
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router'

import { useProblem, useSolution } from '../../api/problems'
import type { ProblemDetail } from '../../api/types'
import { Markdown } from '../../components/Markdown'
import { formatDate, formatMegabytes, formatSeconds } from '../../format'
import { IconBulb, IconEdit, IconFileText, IconLock } from '../../icons'
import { MessagePage } from '../MessagePage'

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap" py={6}>
      <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        {label}
      </Text>
      <div style={{ textAlign: 'right', minWidth: 0 }}>{children}</div>
    </Group>
  )
}

const pointsFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

/** The problem's facts, shown beside the statement (below it on phones). */
function InfoCard({ problem }: { problem: ProblemDetail }) {
  const { t } = useTranslation()
  return (
    <Card withBorder padding="md">
      <Stack gap={0}>
        <InfoRow label={t('problems.points')}>
          <Text size="sm" fw={600}>
            {pointsFormat.format(problem.points)}
            {problem.scoring_mode === 'partial' && (
              <Text span size="xs" c="dimmed" fw={400}>
                {' '}
                ({t('problems.partialShort')})
              </Text>
            )}
          </Text>
        </InfoRow>
        <InfoRow label={t('problems.timeLimit')}>
          <Text size="sm">{t('problems.timeLimitValue', { value: formatSeconds(problem.time_limit_ms) })}</Text>
        </InfoRow>
        <InfoRow label={t('problems.memoryLimit')}>
          <Text size="sm">{t('problems.memoryLimitValue', { value: formatMegabytes(problem.memory_limit_kb) })}</Text>
        </InfoRow>
        {problem.creators.length > 0 && (
          <InfoRow label={t('problems.creators')}>
            <Text size="sm">
              {problem.creators.map((a, i) => (
                <Fragment key={a.id}>
                  {i > 0 && ', '}
                  <Anchor component={Link} to={`/users/${a.username}`} size="sm">
                    {a.display_name}
                  </Anchor>
                </Fragment>
              ))}
            </Text>
          </InfoRow>
        )}
        {problem.group && (
          <InfoRow label={t('problems.group')}>
            <Anchor component={Link} to={`/problems?group=${problem.group.slug}`} size="sm">
              {problem.group.name}
            </Anchor>
          </InfoRow>
        )}
        {problem.types.length > 0 && (
          <InfoRow label={t('problems.types')}>
            <Group gap={4} justify="flex-end">
              {problem.types.map((x) => (
                <Badge key={x.id} variant="light" size="sm" tt="none" component={Link} to={`/problems?type=${x.slug}`} style={{ cursor: 'pointer' }}>
                  {x.name}
                </Badge>
              ))}
            </Group>
          </InfoRow>
        )}
        {problem.published_at && (
          <InfoRow label={t('problems.publishedAt')}>
            <Text size="sm">{formatDate(problem.published_at)}</Text>
          </InfoRow>
        )}
        <InfoRow label={t('problems.languages')}>
          <Text size="sm">
            {problem.allowed_languages.length > 6
              ? t('problems.languageCount', { count: problem.allowed_languages.length })
              : problem.allowed_languages.map((l) => l.name).join(', ')}
          </Text>
        </InfoRow>
      </Stack>
      {problem.allowed_languages.length > 6 && (
        <Text size="xs" c="dimmed" mt={4}>
          {problem.allowed_languages.map((l) => l.name).join(', ')}
        </Text>
      )}
    </Card>
  )
}

function SolutionView({ code }: { code: string }) {
  const { t } = useTranslation()
  const { data, isPending, isError } = useSolution(code, true)
  if (isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }
  if (isError || !data) return <Text c="dimmed">{t('solution.none')}</Text>
  return (
    <Stack gap="sm">
      {!data.is_visible && (
        <Badge variant="light" color="yellow" leftSection={<IconLock size={12} />}>
          {t('solution.staffOnly')}
        </Badge>
      )}
      <Markdown source={data.content_md} />
    </Stack>
  )
}

export function ProblemPage() {
  const { t } = useTranslation()
  const { code = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const { data: problem, isPending, isError } = useProblem(code)

  if (isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }
  if (isError || !problem) {
    return <MessagePage code="404" title={t('common.notFoundTitle')} text={t('problems.notFound')} />
  }

  const tab = params.get('tab') === 'solution' && problem.has_solution ? 'solution' : 'statement'

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="md">
          <Stack gap={6} miw={0}>
            <Group gap="sm">
              <Title order={1} fz={{ base: 26, sm: 32 }} style={{ wordBreak: 'break-word' }}>
                {problem.title}
              </Title>
              {problem.visibility === 'private' && (
                <Badge variant="light" color="yellow" leftSection={<IconLock size={12} />}>
                  {t('problems.private')}
                </Badge>
              )}
            </Group>
            <Text ff="monospace" c="dimmed" size="sm">
              {problem.code}
            </Text>
          </Stack>
          {problem.can_edit && (
            <Button component={Link} to={`/problems/${problem.code}/edit`} variant="default" leftSection={<IconEdit size={16} />}>
              {t('problems.edit')}
            </Button>
          )}
        </Group>

        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 8.5 }} order={{ base: 2, md: 1 }}>
            <Tabs value={tab} onChange={(v) => setParams(v === 'solution' ? { tab: 'solution' } : {}, { replace: true })}>
              {problem.has_solution && (
                <Tabs.List mb="md">
                  <Tabs.Tab value="statement" leftSection={<IconFileText size={16} />}>
                    {t('problems.tab.statement')}
                  </Tabs.Tab>
                  <Tabs.Tab value="solution" leftSection={<IconBulb size={16} />}>
                    {t('problems.tab.solution')}
                  </Tabs.Tab>
                </Tabs.List>
              )}
              <Card withBorder padding="lg">
                {tab === 'statement' ? (
                  problem.statement_md.trim() ? (
                    <Markdown source={problem.statement_md} />
                  ) : (
                    <Text c="dimmed">{t('problems.noStatement')}</Text>
                  )
                ) : (
                  <SolutionView code={problem.code} />
                )}
              </Card>
            </Tabs>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3.5 }} order={{ base: 1, md: 2 }}>
            <div style={{ position: 'sticky', top: 76 }}>
              <InfoCard problem={problem} />
            </div>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}
