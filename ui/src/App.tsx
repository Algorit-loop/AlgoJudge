import { Badge, Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Status = 'ok' | 'down'

interface Health {
  status: Status
  database: Status
  redis: Status
}

// 'checking' = request in flight, 'unreachable' = the API itself did not answer
type HealthState = Health | 'checking' | 'unreachable'

type RowValue = Status | 'checking' | 'unknown'

const BADGE_COLOR: Record<RowValue, string> = { ok: 'green', down: 'red', checking: 'gray', unknown: 'gray' }

async function fetchHealth(): Promise<Health | 'unreachable'> {
  try {
    // A 503 still carries a JSON body saying which dependency is down.
    const res = await fetch('/api/health')
    return (await res.json()) as Health
  } catch {
    return 'unreachable'
  }
}

function rowValues(health: HealthState): { api: RowValue; database: RowValue; redis: RowValue } {
  if (health === 'checking') return { api: 'checking', database: 'checking', redis: 'checking' }
  if (health === 'unreachable') return { api: 'down', database: 'unknown', redis: 'unknown' }
  return { api: 'ok', database: health.database, redis: health.redis }
}

export default function App() {
  const { t } = useTranslation()
  const [health, setHealth] = useState<HealthState>('checking')

  const refresh = useCallback(() => {
    setHealth('checking')
    void fetchHealth().then(setHealth)
  }, [])

  useEffect(refresh, [refresh])

  const values = rowValues(health)
  const rows = [
    { label: t('health.api'), value: values.api },
    { label: t('health.database'), value: values.database },
    { label: t('health.redis'), value: values.redis },
  ]

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>{t('app.name')}</Title>
          <Text c="dimmed">{t('app.tagline')}</Text>
        </div>
        <Card withBorder padding="lg">
          <Stack gap="sm">
            <Group justify="space-between">
              <Title order={4}>{t('health.title')}</Title>
              <Button variant="light" size="xs" onClick={refresh} loading={health === 'checking'}>
                {t('health.refresh')}
              </Button>
            </Group>
            {health === 'unreachable' && <Text c="red">{t('health.unreachable')}</Text>}
            {rows.map(({ label, value }) => (
              <Group key={label} justify="space-between">
                <Text>{label}</Text>
                <Badge color={BADGE_COLOR[value]}>{t(`health.${value}`)}</Badge>
              </Group>
            ))}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
