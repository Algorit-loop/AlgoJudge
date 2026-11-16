import { Avatar, Card, Center, Container, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'

import { usePublicUser } from '../api/users'
import { RoleBadge } from '../components/RoleBadge'
import { formatDate, initials } from '../format'
import { MessagePage } from './MessagePage'

export function ProfilePage() {
  const { t } = useTranslation()
  const { username = '' } = useParams()
  const { data: user, isPending, isError } = usePublicUser(username)

  if (isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }
  if (isError || !user) {
    return <MessagePage code="404" title={t('common.notFoundTitle')} text={t('profile.notFound')} />
  }

  return (
    <Container size="lg" py="xl">
      <Card withBorder padding="xl">
        <Group gap="lg" wrap="nowrap">
          <Avatar color="indigo" radius="xl" size={80}>
            {initials(user.display_name)}
          </Avatar>
          <Stack gap={4} miw={0}>
            <Group gap="sm">
              <Title order={2} style={{ wordBreak: 'break-word' }}>
                {user.display_name}
              </Title>
              <RoleBadge role={user.role} />
            </Group>
            <Text c="dimmed">@{user.username}</Text>
            <Text size="sm" c="dimmed">
              {t('profile.joined', { date: formatDate(user.created_at) })}
            </Text>
          </Stack>
        </Group>
      </Card>
    </Container>
  )
}
