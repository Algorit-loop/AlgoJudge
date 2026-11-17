import { Anchor, AppShell, Burger, Button, Container, Group, NavLink, Skeleton, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconCode, IconFileCode, IconHome, IconListCheck, IconTrophy } from '../icons'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink as RouterNavLink, Outlet, useLocation } from 'react-router'

import { useMe } from '../api/auth'
import classes from './AppLayout.module.css'
import { ColorSchemeToggle } from './ColorSchemeToggle'
import { UserMenu } from './UserMenu'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
}

function useNavItems(): NavItem[] {
  const { t } = useTranslation()
  return [
    { to: '/', label: t('nav.home'), icon: IconHome },
    { to: '/problems', label: t('nav.problems'), icon: IconFileCode },
    { to: '/contests', label: t('nav.contests'), icon: IconTrophy },
    { to: '/submissions', label: t('nav.submissions'), icon: IconListCheck },
  ]
}

function AuthButtons({ fullWidth = false }: { fullWidth?: boolean }) {
  const { t } = useTranslation()
  const location = useLocation()
  // Come back to the current page after logging in.
  const next = location.pathname === '/' ? '' : `?next=${encodeURIComponent(location.pathname + location.search)}`
  return (
    <>
      <Button component={Link} to={`/login${next}`} variant="default" fullWidth={fullWidth}>
        {t('nav.login')}
      </Button>
      <Button component={Link} to="/register" fullWidth={fullWidth}>
        {t('nav.register')}
      </Button>
    </>
  )
}

export function AppLayout() {
  const { t } = useTranslation()
  const [opened, { toggle, close }] = useDisclosure()
  const { data: me, isPending } = useMe()
  const items = useNavItems()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
      padding={0}
    >
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="lg" wrap="nowrap">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label={t('nav.openMenu')} />
              <Anchor component={Link} to="/" underline="never" className={classes.brand}>
                <IconCode size={24} stroke={2.2} />
                <span>{t('app.name')}</span>
              </Anchor>
              <Group gap={4} visibleFrom="sm" wrap="nowrap">
                {items.map((item) => (
                  <RouterNavLink key={item.to} to={item.to} end={item.to === '/'} className={classes.link}>
                    {item.label}
                  </RouterNavLink>
                ))}
              </Group>
            </Group>
            <Group gap="sm" wrap="nowrap">
              <ColorSchemeToggle />
              {isPending ? (
                <Skeleton height={32} width={120} radius="xl" />
              ) : me ? (
                <UserMenu user={me} />
              ) : (
                <Group gap="xs" visibleFrom="sm" wrap="nowrap">
                  <AuthButtons />
                </Group>
              )}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={4}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              component={RouterNavLink}
              to={item.to}
              end={item.to === '/'}
              label={item.label}
              leftSection={<item.icon size={18} />}
              onClick={close}
            />
          ))}
        </Stack>
        {!isPending && !me && (
          <Stack gap="xs" mt="lg" onClick={close}>
            <AuthButtons fullWidth />
          </Stack>
        )}
      </AppShell.Navbar>

      <AppShell.Main className={classes.main}>
        <div className={classes.content}>
          <Outlet />
        </div>
        <footer className={classes.footer}>
          <Container size="lg">
            <Group justify="space-between" gap="xs">
              <Text size="sm" c="dimmed">
                © {new Date().getFullYear()} {t('app.name')} · {t('app.tagline')}
              </Text>
              <Anchor component={Link} to="/status" size="sm" c="dimmed">
                {t('nav.status')}
              </Anchor>
            </Group>
          </Container>
        </footer>
      </AppShell.Main>
    </AppShell>
  )
}
