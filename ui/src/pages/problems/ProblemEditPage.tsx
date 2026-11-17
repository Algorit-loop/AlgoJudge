import {
  Alert,
  Anchor,
  Button,
  Card,
  Center,
  Container,
  FileButton,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconArrowLeft, IconDeviceFloppy, IconPhoto, IconTrash } from '../../icons'
import { type ClipboardEvent, type DragEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import { ApiError, errorCode } from '../../api/client'
import {
  uploadProblemImage,
  useDeleteProblem,
  useProblem,
  useSetAuthors,
  useUpdateProblem,
} from '../../api/problems'
import type { ProblemDetail, Visibility } from '../../api/types'
import { Markdown } from '../../components/Markdown'
import { MessagePage } from '../MessagePage'
import { MEMORY_LIMIT_MB, mbToKb, secondsToMs, TIME_LIMIT_SECONDS } from './limits'

interface FormValues {
  title: string
  timeLimit: number
  memoryLimit: number
  visibility: Visibility
  statement: string
}

const toForm = (p: ProblemDetail): FormValues => ({
  title: p.title,
  timeLimit: p.time_limit_ms / 1000,
  memoryLimit: p.memory_limit_kb / 1024,
  visibility: p.visibility,
  statement: p.statement_md,
})

export function ProblemEditPage() {
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
  if (!problem.can_edit) {
    return <MessagePage code="403" title={t('common.forbiddenTitle')} text={t('problems.cannotEdit')} />
  }
  // Keyed by code so switching problems starts from a fresh form.
  return <Editor key={problem.code} problem={problem} />
}

function Editor({ problem }: { problem: ProblemDetail }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const update = useUpdateProblem(problem.code)
  const setAuthors = useSetAuthors(problem.code)
  const remove = useDeleteProblem()
  const [deleteOpened, deleteModal] = useDisclosure(false)
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [uploading, setUploading] = useState(false)
  const [authors, setAuthorsValue] = useState(problem.authors.map((a) => a.username))
  const textarea = useRef<HTMLTextAreaElement>(null)

  const form = useForm<FormValues>({
    initialValues: toForm(problem),
    validate: {
      title: (v) => (v.trim() ? null : t('validation.required')),
      timeLimit: (v) => (v >= TIME_LIMIT_SECONDS.min && v <= TIME_LIMIT_SECONDS.max ? null : t('problems.timeRange')),
      memoryLimit: (v) => (v >= MEMORY_LIMIT_MB.min && v <= MEMORY_LIMIT_MB.max ? null : t('problems.memoryRange')),
    },
  })
  const dirty = form.isDirty()

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const onSave = form.onSubmit((v) =>
    update.mutate(
      {
        title: v.title.trim(),
        statement_md: v.statement,
        time_limit_ms: secondsToMs(v.timeLimit),
        memory_limit_kb: mbToKb(v.memoryLimit),
        ...(problem.can_change_visibility ? { visibility: v.visibility } : {}),
      },
      {
        onSuccess: (p) => {
          form.setInitialValues(toForm(p))
          form.setValues(toForm(p))
          form.resetDirty(toForm(p))
          notifications.show({ color: 'green', message: t('problems.saved') })
        },
        onError: (e) => notifications.show({ color: 'red', message: t(`errors.${errorCode(e)}`) }),
      },
    ),
  )

  const onSaveAuthors = () =>
    setAuthors.mutate(authors, {
      onSuccess: (p) => {
        setAuthorsValue(p.authors.map((a) => a.username))
        notifications.show({ color: 'green', message: t('problems.authorsSaved') })
      },
      onError: (e) => {
        const name = e instanceof ApiError && e.field ? e.field : ''
        notifications.show({ color: 'red', message: `${t(`errors.${errorCode(e)}`)}${name ? ` (${name})` : ''}` })
      },
    })

  /** Upload images and insert Markdown for them at the cursor. */
  const insertImages = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (images.length === 0) return
    setUploading(true)
    try {
      const snippets: string[] = []
      for (const file of images) {
        try {
          const { url } = await uploadProblemImage(problem.code, file)
          snippets.push(`![](${url})`)
        } catch (e) {
          notifications.show({ color: 'red', message: `${file.name}: ${t(`errors.${errorCode(e)}`)}` })
        }
      }
      if (snippets.length === 0) return
      const el = textarea.current
      const text = form.values.statement
      const start = el?.selectionStart ?? text.length
      const end = el?.selectionEnd ?? text.length
      const insert = snippets.join('\n')
      form.setFieldValue('statement', text.slice(0, start) + insert + text.slice(end))
      requestAnimationFrame(() => {
        el?.focus()
        el?.setSelectionRange(start + insert.length, start + insert.length)
      })
    } finally {
      setUploading(false)
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files)
    if (files.some((f) => f.type.startsWith('image/'))) {
      e.preventDefault()
      void insertImages(files)
    }
  }
  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      e.preventDefault()
      void insertImages(files)
    }
  }

  const onDelete = () =>
    remove.mutate(problem.code, {
      onSuccess: () => {
        notifications.show({ message: t('problems.deleted', { code: problem.code }) })
        void navigate('/problems', { replace: true })
      },
      onError: (e) => notifications.show({ color: 'red', message: t(`errors.${errorCode(e)}`) }),
    })

  const editor = (
    <Textarea
      ref={textarea}
      label={t('problems.statement')}
      description={t('problems.statementHint')}
      autosize
      minRows={22}
      maxRows={60}
      styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 14 } }}
      onPaste={onPaste}
      onDrop={onDrop}
      {...form.getInputProps('statement')}
    />
  )
  const preview = (
    <Stack gap={6}>
      <Text size="sm" fw={500}>
        {t('problems.preview')}
      </Text>
      <Card withBorder padding="lg" mih={300}>
        {form.values.statement.trim() ? (
          <Markdown source={form.values.statement} />
        ) : (
          <Text c="dimmed" size="sm">
            {t('problems.noStatement')}
          </Text>
        )}
      </Card>
    </Stack>
  )

  return (
    <Container size="xl" py="xl">
      <form onSubmit={onSave} noValidate>
        <Stack gap="lg">
          <Group justify="space-between" align="flex-end">
            <Stack gap={4}>
              <Anchor component={Link} to={`/problems/${problem.code}`} size="sm">
                <Group gap={4}>
                  <IconArrowLeft size={14} />
                  {t('problems.backToProblem')}
                </Group>
              </Anchor>
              <Title order={2}>
                {t('problems.editTitle')} <Text span ff="monospace" inherit c="dimmed">{problem.code}</Text>
              </Title>
            </Stack>
            <Group gap="sm">
              {dirty && (
                <Text size="sm" c="dimmed">
                  {t('problems.unsaved')}
                </Text>
              )}
              <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={update.isPending} disabled={!dirty}>
                {t('common.save')}
              </Button>
            </Group>
          </Group>

          {update.isError && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {t(`errors.${errorCode(update.error)}`)}
            </Alert>
          )}

          <Card withBorder padding="lg">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput label={t('problems.name')} required {...form.getInputProps('title')} />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 2 }}>
                <NumberInput
                  label={t('problems.timeLimit')}
                  suffix={` ${t('problems.secondsUnit')}`}
                  min={TIME_LIMIT_SECONDS.min}
                  max={TIME_LIMIT_SECONDS.max}
                  step={0.5}
                  decimalScale={2}
                  decimalSeparator=","
                  {...form.getInputProps('timeLimit')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 2 }}>
                <NumberInput
                  label={t('problems.memoryLimit')}
                  suffix=" MB"
                  min={MEMORY_LIMIT_MB.min}
                  max={MEMORY_LIMIT_MB.max}
                  step={64}
                  allowDecimal={false}
                  {...form.getInputProps('memoryLimit')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 2 }}>
                <Stack gap={4}>
                  <Text size="sm" fw={500}>
                    {t('problems.visibility')}
                  </Text>
                  <SegmentedControl
                    fullWidth
                    disabled={!problem.can_change_visibility}
                    data={[
                      { value: 'private', label: t('problems.private') },
                      { value: 'public', label: t('problems.public') },
                    ]}
                    {...form.getInputProps('visibility')}
                  />
                </Stack>
              </Grid.Col>
            </Grid>
            {!problem.can_change_visibility && (
              <Text size="xs" c="dimmed" mt="xs">
                {t('problems.visibilityAdminOnly')}
              </Text>
            )}
          </Card>

          <Card withBorder padding="lg">
            <Group align="flex-end" gap="sm">
              <TagsInput
                label={t('problems.authors')}
                description={t('problems.authorsHint')}
                value={authors}
                onChange={setAuthorsValue}
                splitChars={[',', ' ']}
                clearable
                style={{ flex: 1 }}
                miw={240}
              />
              <Button variant="default" onClick={onSaveAuthors} loading={setAuthors.isPending}>
                {t('problems.saveAuthors')}
              </Button>
            </Group>
          </Card>

          <Group justify="space-between">
            <SegmentedControl
              hiddenFrom="md"
              value={view}
              onChange={(v) => setView(v as 'edit' | 'preview')}
              data={[
                { value: 'edit', label: t('problems.write') },
                { value: 'preview', label: t('problems.preview') },
              ]}
            />
            <FileButton onChange={(files) => void insertImages(files)} accept="image/png,image/jpeg,image/gif,image/webp" multiple>
              {(props) => (
                <Button {...props} variant="light" leftSection={<IconPhoto size={16} />} loading={uploading} ml="auto">
                  {t('problems.insertImage')}
                </Button>
              )}
            </FileButton>
          </Group>

          {/* Side by side on wide screens; a write/preview switch on small ones. */}
          <Grid visibleFrom="md">
            <Grid.Col span={6}>{editor}</Grid.Col>
            <Grid.Col span={6}>{preview}</Grid.Col>
          </Grid>
          <Stack hiddenFrom="md">{view === 'edit' ? editor : preview}</Stack>

          {problem.can_change_visibility && (
            <Card withBorder padding="lg" style={{ borderColor: 'var(--mantine-color-red-4)' }}>
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{t('problems.deleteTitle')}</Text>
                  <Text size="sm" c="dimmed">
                    {t('problems.deleteHint')}
                  </Text>
                </div>
                <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={deleteModal.open}>
                  {t('problems.delete')}
                </Button>
              </Group>
            </Card>
          )}
        </Stack>
      </form>

      <Modal opened={deleteOpened} onClose={deleteModal.close} title={t('problems.deleteTitle')} centered>
        <Stack>
          <Text size="sm">{t('problems.deleteConfirm', { code: problem.code })}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={deleteModal.close}>
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={onDelete} loading={remove.isPending}>
              {t('problems.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
