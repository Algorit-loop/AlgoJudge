import { Anchor, Badge, Button, Card, Center, Container, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { IconEdit, IconLock } from '../../icons'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { useProblem } from '../../api/problems'
import { Markdown } from '../../components/Markdown'
import { ProblemLimits } from '../../components/ProblemLimits'
import { MessagePage } from '../MessagePage'

export function ProblemPage() {
  const { t } = useTranslation()
  const { code = '' } = useParams()
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
            <Group gap="md">
              <Text ff="monospace" c="dimmed" size="sm">
                {problem.code}
              </Text>
              <ProblemLimits timeMs={problem.time_limit_ms} memoryKb={problem.memory_limit_kb} />
            </Group>
            {problem.authors.length > 0 && (
              <Text size="sm" c="dimmed">
                {t('problems.authors')}:{' '}
                {problem.authors.map((a, i) => (
                  <Fragment key={a.id}>
                    {i > 0 && ', '}
                    <Anchor component={Link} to={`/users/${a.username}`} size="sm">
                      {a.display_name}
                    </Anchor>
                  </Fragment>
                ))}
              </Text>
            )}
          </Stack>
          {problem.can_edit && (
            <Button
              component={Link}
              to={`/problems/${problem.code}/edit`}
              variant="default"
              leftSection={<IconEdit size={16} />}
            >
              {t('problems.edit')}
            </Button>
          )}
        </Group>

        <Card withBorder padding="lg">
          {problem.statement_md.trim() ? (
            <Markdown source={problem.statement_md} />
          ) : (
            <Text c="dimmed">{t('problems.noStatement')}</Text>
          )}
        </Card>
      </Stack>
    </Container>
  )
}
