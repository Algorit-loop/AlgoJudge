import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { type CatalogKind, useCatalog, useCatalogMutations, useLanguages, useUpdateLanguage } from '../../api/catalog'
import { ApiError, errorCode } from '../../api/client'
import type { CatalogItem, Language } from '../../api/types'
import { IconCategory, IconEdit, IconLanguage, IconPlus, IconTags, IconTrash } from '../../icons'

const SLUG_RE = /^[a-z0-9_-]{1,32}$/

function toast(ok: boolean, message: string) {
  notifications.show({ color: ok ? 'green' : 'red', message })
}

function LanguagesTab() {
  const { t } = useTranslation()
  const { data } = useLanguages(true)
  const update = useUpdateLanguage()
  const [editing, setEditing] = useState<Language | null>(null)
  const form = useForm({ initialValues: { name: '', sort_order: 0 } })

  const save = (lang: Language, change: Partial<Language>) =>
    update.mutate(
      { key: lang.key, ...change },
      {
        onSuccess: () => toast(true, t('catalog.saved')),
        onError: (e) => toast(false, t(`errors.${errorCode(e)}`)),
      },
    )

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        {t('catalog.languagesHint')}
      </Text>
      <Card withBorder padding={0}>
        <Table verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={140}>{t('catalog.key')}</Table.Th>
              <Table.Th>{t('catalog.name')}</Table.Th>
              <Table.Th w={90}>{t('catalog.ext')}</Table.Th>
              <Table.Th w={90}>{t('catalog.order')}</Table.Th>
              <Table.Th w={100}>{t('catalog.enabled')}</Table.Th>
              <Table.Th w={60} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(data ?? []).map((lang) => (
              <Table.Tr key={lang.key} opacity={lang.is_enabled ? 1 : 0.6}>
                <Table.Td>
                  <Text ff="monospace" size="sm">
                    {lang.key}
                  </Text>
                </Table.Td>
                <Table.Td>{lang.name}</Table.Td>
                <Table.Td>
                  <Text ff="monospace" size="sm" c="dimmed">
                    .{lang.ext}
                  </Text>
                </Table.Td>
                <Table.Td>{lang.sort_order}</Table.Td>
                <Table.Td>
                  <Switch
                    checked={lang.is_enabled}
                    onChange={(e) => save(lang, { is_enabled: e.currentTarget.checked })}
                    aria-label={t('catalog.enabled')}
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label={t('catalog.edit')}
                    onClick={() => {
                      form.setValues({ name: lang.name, sort_order: lang.sort_order })
                      setEditing(lang)
                    }}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
      <Modal opened={!!editing} onClose={() => setEditing(null)} title={editing?.key} centered>
        <form
          onSubmit={form.onSubmit((v) => {
            if (editing) save(editing, { name: v.name.trim(), sort_order: v.sort_order })
            setEditing(null)
          })}
        >
          <Stack>
            <TextInput label={t('catalog.name')} required {...form.getInputProps('name')} />
            <NumberInput label={t('catalog.order')} min={0} max={10000} allowDecimal={false} {...form.getInputProps('sort_order')} />
            <Group justify="flex-end">
              <Button type="submit">{t('common.save')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}

function ItemsTab({ kind }: { kind: CatalogKind }) {
  const { t } = useTranslation()
  const { data } = useCatalog(kind)
  const { create, update, remove } = useCatalogMutations(kind)
  const [editing, setEditing] = useState<CatalogItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CatalogItem | null>(null)
  const form = useForm({
    initialValues: { slug: '', name: '' },
    validate: {
      slug: (v) => (SLUG_RE.test(v) ? null : t('catalog.slugFormat')),
      name: (v) => (v.trim() ? null : t('validation.required')),
    },
  })

  const open = (item: CatalogItem | 'new') => {
    form.setValues(item === 'new' ? { slug: '', name: '' } : { slug: item.slug, name: item.name })
    form.clearErrors()
    setEditing(item)
  }
  const onSubmit = form.onSubmit((v) => {
    const body = { slug: v.slug, name: v.name.trim() }
    const opts = {
      onSuccess: () => {
        toast(true, t('catalog.saved'))
        setEditing(null)
      },
      onError: (e: unknown) => {
        if (e instanceof ApiError && e.field === 'slug') form.setFieldError('slug', t(`errors.${e.code}`))
        else toast(false, t(`errors.${errorCode(e)}`))
      },
    }
    if (editing === 'new') create.mutate(body, opts)
    else if (editing) update.mutate({ id: editing.id, ...body }, opts)
  })

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {t(`catalog.${kind}.hint`)}
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => open('new')}>
          {t(`catalog.${kind}.add`)}
        </Button>
      </Group>
      <Card withBorder padding={0}>
        <Table verticalSpacing="xs" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('catalog.name')}</Table.Th>
              <Table.Th w={220}>{t('catalog.slug')}</Table.Th>
              <Table.Th w={90} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data && data.length > 0 ? (
              data.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.name}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="gray" tt="none" ff="monospace">
                      {item.slug}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label={t('catalog.edit')}>
                        <ActionIcon variant="subtle" color="gray" onClick={() => open(item)} aria-label={t('catalog.edit')}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t('catalog.delete')}>
                        <ActionIcon variant="subtle" color="red" onClick={() => setDeleting(item)} aria-label={t('catalog.delete')}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text ta="center" c="dimmed" py="md">
                    {t('catalog.empty')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t(`catalog.${kind}.add`) : t('catalog.edit')}
        centered
      >
        <form onSubmit={onSubmit} noValidate>
          <Stack>
            <TextInput label={t('catalog.name')} required autoFocus {...form.getInputProps('name')} />
            <TextInput
              label={t('catalog.slug')}
              description={t('catalog.slugHint')}
              required
              ff="monospace"
              {...form.getInputProps('slug')}
              onChange={(e) => form.setFieldValue('slug', e.currentTarget.value.toLowerCase())}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setEditing(null)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={create.isPending || update.isPending}>
                {t('common.save')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={deleting !== null} onClose={() => setDeleting(null)} title={t('catalog.delete')} centered>
        <Stack>
          <Text size="sm">{t('catalog.deleteConfirm', { name: deleting?.name })}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleting(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              color="red"
              loading={remove.isPending}
              onClick={() =>
                deleting &&
                remove.mutate(deleting.id, {
                  onSuccess: () => {
                    toast(true, t('catalog.deleted'))
                    setDeleting(null)
                  },
                  onError: (e) => toast(false, t(`errors.${errorCode(e)}`)),
                })
              }
            >
              {t('catalog.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

export function CatalogPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const tab = ['problem-types', 'problem-groups', 'languages'].includes(params.get('tab') ?? '')
    ? (params.get('tab') as string)
    : 'problem-types'
  return (
    <Container size="lg" py="xl">
      <Stack>
        <Title order={2}>{t('catalog.title')}</Title>
        <Tabs value={tab} onChange={(v) => v && setParams({ tab: v }, { replace: true })}>
          <Tabs.List mb="md">
            <Tabs.Tab value="problem-types" leftSection={<IconTags size={16} />}>
              {t('catalog.problem-types.title')}
            </Tabs.Tab>
            <Tabs.Tab value="problem-groups" leftSection={<IconCategory size={16} />}>
              {t('catalog.problem-groups.title')}
            </Tabs.Tab>
            <Tabs.Tab value="languages" leftSection={<IconLanguage size={16} />}>
              {t('catalog.languages')}
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="problem-types">
            <ItemsTab kind="problem-types" />
          </Tabs.Panel>
          <Tabs.Panel value="problem-groups">
            <ItemsTab kind="problem-groups" />
          </Tabs.Panel>
          <Tabs.Panel value="languages">
            <LanguagesTab />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}
