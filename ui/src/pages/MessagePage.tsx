import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

/** Full-page message: 404, 403, "coming soon"... */
export function MessagePage({ title, text, code }: { title: string; text: string; code?: string }) {
  const { t } = useTranslation()
  return (
    <Container size="sm" py={80}>
      <Stack align="center" gap="md" ta="center">
        {code && (
          <Text fz={72} fw={900} lh={1} c="dimmed" style={{ opacity: 0.35 }}>
            {code}
          </Text>
        )}
        <Title order={2}>{title}</Title>
        <Text c="dimmed">{text}</Text>
        <Button component={Link} to="/" variant="light" mt="sm">
          {t('common.backHome')}
        </Button>
      </Stack>
    </Container>
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()
  return <MessagePage code="404" title={t('common.notFoundTitle')} text={t('common.notFoundText')} />
}

export function ComingSoonPage() {
  const { t } = useTranslation()
  return <MessagePage title={t('common.comingSoonTitle')} text={t('common.comingSoonText')} />
}
