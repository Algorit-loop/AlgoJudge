import { Button, Card, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconFileCode, IconInbox, IconListNumbers, IconTrophy } from '@tabler/icons-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { useMe } from '../api/auth'
import classes from './HomePage.module.css'

function Feature({ icon: Icon, title, text }: { icon: ComponentType<{ size?: number }>; title: string; text: string }) {
  return (
    <Card withBorder padding="lg">
      <ThemeIcon size={44} radius="md" variant="light">
        <Icon size={24} />
      </ThemeIcon>
      <Text fw={600} mt="md">
        {title}
      </Text>
      <Text size="sm" c="dimmed" mt={6}>
        {text}
      </Text>
    </Card>
  )
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <Card withBorder padding="lg">
      <Title order={4}>{title}</Title>
      <Stack align="center" gap={6} py="xl" c="dimmed">
        <IconInbox size={32} stroke={1.5} />
        <Text size="sm">{text}</Text>
      </Stack>
    </Card>
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const { data: me } = useMe()

  return (
    <>
      <section className={classes.hero}>
        <Container size="lg" py={64}>
          <Stack gap="md" maw={640}>
            {me ? (
              <>
                <Title className={classes.title}>{t('home.welcomeBack', { name: me.display_name })}</Title>
                <Text size="lg" c="dimmed">
                  {t('home.welcomeText')}
                </Text>
                <Group mt="sm">
                  <Button component={Link} to="/problems" size="md">
                    {t('home.browseProblems')}
                  </Button>
                  <Button component={Link} to="/contests" size="md" variant="default">
                    {t('nav.contests')}
                  </Button>
                </Group>
              </>
            ) : (
              <>
                <Title className={classes.title}>{t('home.heroTitle')}</Title>
                <Text size="lg" c="dimmed">
                  {t('home.heroText')}
                </Text>
                <Group mt="sm">
                  <Button component={Link} to="/register" size="md">
                    {t('home.getStarted')}
                  </Button>
                  <Button component={Link} to="/problems" size="md" variant="default">
                    {t('home.browseProblems')}
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Container>
      </section>

      <Container size="lg" py="xl">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          <Feature icon={IconFileCode} title={t('home.features.practiceTitle')} text={t('home.features.practiceText')} />
          <Feature icon={IconTrophy} title={t('home.features.icpcTitle')} text={t('home.features.icpcText')} />
          <Feature icon={IconListNumbers} title={t('home.features.ioiTitle')} text={t('home.features.ioiText')} />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mt="lg">
          <EmptyPanel title={t('home.upcomingContests')} text={t('home.noContests')} />
          <EmptyPanel title={t('home.newProblems')} text={t('home.noProblems')} />
        </SimpleGrid>
      </Container>
    </>
  )
}
