import { Anchor, Container, Paper, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Centered card used by the login and sign-up pages. */
export function AuthCard(props: {
  title: string
  subtitle: string
  linkLabel: string
  linkTo: string
  children: ReactNode
}) {
  return (
    <Container size={440} py={64}>
      <Title ta="center" order={2}>
        {props.title}
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={6}>
        {props.subtitle}{' '}
        <Anchor component={Link} to={props.linkTo} size="sm">
          {props.linkLabel}
        </Anchor>
      </Text>
      <Paper withBorder shadow="sm" p="xl" mt="xl" radius="md">
        {props.children}
      </Paper>
    </Container>
  )
}

/** Only follow `next` to a path on this site (prevents open redirects such as ?next=//evil.example). */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}
