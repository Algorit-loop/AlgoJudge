import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useRouteError } from 'react-router'

const RELOAD_KEY = 'aj:chunk-reload-at'

/** A page's code failed to download: a flaky connection, or a new deploy removed the old file. */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported|Failed to fetch/i.test(
    message,
  )
}

function reloadedRecently(): boolean {
  try {
    const at = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    return Date.now() - at < 10_000
  } catch {
    return true // no storage: never auto-reload, to avoid a reload loop
  }
}

/** Shown instead of a blank screen when rendering a route throws. */
export function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()

  if (isChunkLoadError(error) && !reloadedRecently()) {
    // Reload once to fetch fresh code; the timestamp prevents a loop if the error persists.
    try {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    window.location.reload()
    return null
  }

  console.error(error)
  return (
    <Container size="sm" py={80}>
      <Stack align="center" gap="md" ta="center">
        <Title order={2}>{t('common.errorTitle')}</Title>
        <Text c="dimmed">{t('common.errorText')}</Text>
        <Button onClick={() => window.location.reload()}>{t('common.reload')}</Button>
      </Stack>
    </Container>
  )
}
