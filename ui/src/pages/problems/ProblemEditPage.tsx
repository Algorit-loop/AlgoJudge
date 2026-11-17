import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Checkbox,
  Container,
  Grid,
  Group,
  Loader,
  Modal,
  MultiSelect,
  NumberInput,
  Radio,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  TagsInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import { useCatalog, useLanguages } from '../../api/catalog'
import { ApiError, errorCode } from '../../api/client'
import {
  uploadProblemImage,
  useDeleteProblem,
  useDeleteSolution,
  useProblemSettings,
  useSaveSolution,
  useSetMembers,
  useSolution,
  useUpdateProblem,
} from '../../api/problems'
import {
  type ProblemSettings,
  SCORING_MODES,
  type ScoringMode,
  SOURCE_VISIBILITIES,
  type SourceVisibility,
  TESTCASE_RESULT_VISIBILITIES,
  TESTCASE_VISIBILITIES,
  type TestcaseResultVisibility,
  type TestcaseVisibility,
  type Visibility,
} from '../../api/types'
import { MarkdownEditor } from '../../components/editor/MarkdownEditor'
import {
  IconArrowLeft,
  IconBulb,
  IconDeviceFloppy,
  IconFileText,
  IconInfoCircle,
  IconScale,
  IconShieldLock,
  IconTrash,
} from '../../icons'
import { MessagePage } from '../MessagePage'
import { MEMORY_LIMIT_MB, mbToKb, POINTS, secondsToMs, TIME_LIMIT_SECONDS } from './limits'

type Tab = 'statement' | 'general' | 'judging' | 'access' | 'solution'
const TABS: Tab[] = ['statement', 'general', 'judging', 'access', 'solution']

interface FormValues {
  title: string
  statement: string
  publishedAt: Date | null
  groupId: string | null
  typeIds: string[]
  points: number
  timeLimit: number
  memoryLimit: number
  scoringMode: ScoringMode
  languageKeys: string[]
  visibility: Visibility
  sourceVisibility: SourceVisibility
  testcaseVisibility: TestcaseVisibility
  testcaseResultVisibility: TestcaseResultVisibility
  creators: string[]
  curators: string[]
  testers: string[]
}

const toForm = (p: ProblemSettings): FormValues => ({
  title: p.title,
  statement: p.statement_md,
  publishedAt: p.published_at ? new Date(p.published_at) : null,
  groupId: p.group ? String(p.group.id) : null,
  typeIds: p.types.map((x) => String(x.id)),
  points: p.points,
  timeLimit: p.time_limit_ms / 1000,
  memoryLimit: p.memory_limit_kb / 1024,
  scoringMode: p.scoring_mode,
  languageKeys: p.allowed_languages.map((l) => l.key),
  visibility: p.visibility,
  sourceVisibility: p.source_visibility,
  testcaseVisibility: p.testcase_visibility,
  testcaseResultVisibility: p.testcase_result_visibility,
  creators: p.creators.map((u) => u.username),
  curators: p.curators.map((u) => u.username),
  testers: p.testers.map((u) => u.username),
})

const MEMBER_FIELDS = ['creators', 'curators', 'testers'] as const
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])

export function ProblemEditPage() {
  const { t } = useTranslation()
  const { code = '' } = useParams()
  const { data: problem, isPending, isError, error } = useProblemSettings(code)

  if (isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }
  if (isError || !problem) {
    if (error instanceof ApiError && error.status === 403) {
      return <MessagePage code="403" title={t('common.forbiddenTitle')} text={t('problems.cannotEdit')} />
    }
    return <MessagePage code="404" title={t('common.notFoundTitle')} text={t('problems.notFound')} />
  }
  // Keyed by code so switching problems starts from a fresh form.
  return <Editor key={problem.code} problem={problem} />
}

/** A titled block inside a tab. */
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        <div>
          <Text fw={600}>{title}</Text>
          {description && (
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          )}
        </div>
        {children}
      </Stack>
    </Card>
  )
}

/** A radio group where every option has a label and an explanation. */
function ChoiceGroup<T extends string>(props: {
  label: string
  description?: string
  value: T
  onChange: (v: T) => void
  options: T[]
  i18nPrefix: string
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Radio.Group
      label={props.label}
      description={props.description}
      value={props.value}
      onChange={(v) => props.onChange(v as T)}
    >
      <Stack gap="xs" mt="xs">
        {props.options.map((opt) => (
          <Radio.Card key={opt} value={opt} p="sm" radius="md" disabled={props.disabled}>
            <Group wrap="nowrap" align="flex-start" gap="sm">
              <Radio.Indicator mt={2} />
              <div>
                <Text size="sm" fw={500}>
                  {t(`${props.i18nPrefix}.${opt}` as string)}
                </Text>
                <Text size="xs" c="dimmed">
                  {t(`${props.i18nPrefix}.${opt}Hint` as string)}
                </Text>
              </div>
            </Group>
          </Radio.Card>
        ))}
      </Stack>
    </Radio.Group>
  )
}

function Editor({ problem }: { problem: ProblemSettings }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'statement') as Tab
  const update = useUpdateProblem(problem.code)
  const setMembers = useSetMembers(problem.code)
  const remove = useDeleteProblem()
  const [deleteOpened, deleteModal] = useDisclosure(false)
  const groups = useCatalog('problem-groups')
  const types = useCatalog('problem-types')
  // Editors also see disabled languages that the problem still allows.
  const languages = useLanguages(problem.can_change_visibility)

  const form = useForm<FormValues>({
    initialValues: toForm(problem),
    validate: {
      title: (v) => (v.trim() ? null : t('validation.required')),
      timeLimit: (v) => (v >= TIME_LIMIT_SECONDS.min && v <= TIME_LIMIT_SECONDS.max ? null : t('problems.timeRange')),
      memoryLimit: (v) => (v >= MEMORY_LIMIT_MB.min && v <= MEMORY_LIMIT_MB.max ? null : t('problems.memoryRange')),
      points: (v) => (v >= POINTS.min && v <= POINTS.max ? null : t('problems.pointsRange')),
      languageKeys: (v) => (v.length > 0 ? null : t('problems.languagesRequired')),
      creators: (v) => (v.length > 0 ? null : t('problems.creatorsRequired')),
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

  const showError = (e: unknown) => {
    const field = e instanceof ApiError && e.field ? ` (${e.field})` : ''
    notifications.show({ color: 'red', message: `${t(`errors.${errorCode(e)}`)}${field}` })
  }

  const onSave = form.onSubmit(
    async (v) => {
      const init = form.getInitialValues()
      try {
        let saved: ProblemSettings | undefined
        if (MEMBER_FIELDS.some((f) => !sameList(v[f], init[f]))) {
          saved = await setMembers.mutateAsync({ creators: v.creators, curators: v.curators, testers: v.testers })
        }
        saved = await update.mutateAsync({
          title: v.title.trim(),
          statement_md: v.statement,
          time_limit_ms: secondsToMs(v.timeLimit),
          memory_limit_kb: mbToKb(v.memoryLimit),
          points: v.points,
          scoring_mode: v.scoringMode,
          published_at: v.publishedAt ? v.publishedAt.toISOString() : null,
          group_id: v.groupId ? Number(v.groupId) : null,
          type_ids: v.typeIds.map(Number),
          language_keys: v.languageKeys,
          source_visibility: v.sourceVisibility,
          testcase_visibility: v.testcaseVisibility,
          testcase_result_visibility: v.testcaseResultVisibility,
          ...(problem.can_change_visibility ? { visibility: v.visibility } : {}),
        })
        const values = toForm(saved)
        form.setInitialValues(values)
        form.setValues(values)
        notifications.show({ color: 'green', message: t('problems.saved') })
      } catch (e) {
        showError(e)
      }
    },
    (errors) => {
      // Jump to the tab that holds the first invalid field.
      const field = Object.keys(errors)[0]
      const where: Record<string, Tab> = {
        title: 'statement',
        points: 'general',
        timeLimit: 'judging',
        memoryLimit: 'judging',
        languageKeys: 'judging',
        creators: 'access',
      }
      if (field && where[field]) setParams({ tab: where[field] }, { replace: true })
    },
  )

  const onDelete = () =>
    remove.mutate(problem.code, {
      onSuccess: () => {
        notifications.show({ message: t('problems.deleted', { code: problem.code }) })
        void navigate('/problems', { replace: true })
      },
      onError: showError,
    })

  const allLanguages = languages.data ?? []
  const languageOptions = [
    ...allLanguages,
    // Keep languages the problem allows even if they are now disabled site-wide.
    ...problem.allowed_languages.filter((l) => !allLanguages.some((x) => x.key === l.key)),
  ]
  const saving = update.isPending || setMembers.isPending
  const tabIcon = { statement: IconFileText, general: IconInfoCircle, judging: IconScale, access: IconShieldLock, solution: IconBulb }

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
              <Group gap="sm">
                <Title order={2}>{t('problems.editTitle')}</Title>
                <Text ff="monospace" c="dimmed" fz="xl">
                  {problem.code}
                </Text>
                <Badge variant="light" color={problem.visibility === 'public' ? 'green' : 'yellow'}>
                  {t(`problems.${problem.visibility}`)}
                </Badge>
              </Group>
            </Stack>
            {tab !== 'solution' && (
              <Group gap="sm">
                {dirty && (
                  <Text size="sm" c="dimmed">
                    {t('problems.unsaved')}
                  </Text>
                )}
                <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={saving} disabled={!dirty}>
                  {t('common.save')}
                </Button>
              </Group>
            )}
          </Group>

          <Tabs value={tab} onChange={(v) => v && setParams({ tab: v }, { replace: true })} keepMounted={false}>
            <Tabs.List>
              {TABS.map((key) => {
                const Icon = tabIcon[key]
                return (
                  <Tabs.Tab key={key} value={key} leftSection={<Icon size={16} />}>
                    {t(`problems.tab.${key}`)}
                  </Tabs.Tab>
                )
              })}
            </Tabs.List>

            <Tabs.Panel value="statement" pt="lg">
              <Stack>
                <TextInput label={t('problems.name')} required {...form.getInputProps('title')} />
                <MarkdownEditor
                  label={t('problems.statement')}
                  value={form.values.statement}
                  onChange={(v) => form.setFieldValue('statement', v)}
                  uploadImage={(file) => uploadProblemImage(problem.code, file)}
                  placeholder={t('editor.placeholder')}
                  height={620}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="general" pt="lg">
              <Stack>
                <Section title={t('problems.section.identity')}>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput label={t('problems.code')} value={problem.code} readOnly description={t('problems.codeFixed')} ff="monospace" />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <DateTimePicker
                        label={t('problems.publishedAt')}
                        description={t('problems.publishedAtHint')}
                        clearable
                        valueFormat="DD/MM/YYYY HH:mm"
                        value={form.values.publishedAt}
                        onChange={(v) => form.setFieldValue('publishedAt', v ? new Date(v) : null)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <NumberInput
                        label={t('problems.points')}
                        description={t('problems.pointsHint')}
                        min={POINTS.min}
                        max={POINTS.max}
                        decimalScale={2}
                        decimalSeparator=","
                        {...form.getInputProps('points')}
                      />
                    </Grid.Col>
                  </Grid>
                </Section>
                <Section title={t('problems.section.classification')} description={t('problems.section.classificationHint')}>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <MultiSelect
                      label={t('problems.types')}
                      description={t('problems.typesHint')}
                      data={(types.data ?? []).map((x) => ({ value: String(x.id), label: x.name }))}
                      searchable
                      clearable
                      nothingFoundMessage={t('problems.noCatalog')}
                      {...form.getInputProps('typeIds')}
                    />
                    <Select
                      label={t('problems.group')}
                      description={t('problems.groupHint')}
                      data={(groups.data ?? []).map((x) => ({ value: String(x.id), label: x.name }))}
                      searchable
                      clearable
                      nothingFoundMessage={t('problems.noCatalog')}
                      {...form.getInputProps('groupId')}
                    />
                  </SimpleGrid>
                </Section>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="judging" pt="lg">
              <Stack>
                <Section title={t('problems.section.limits')}>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
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
                    <NumberInput
                      label={t('problems.memoryLimit')}
                      suffix=" MB"
                      min={MEMORY_LIMIT_MB.min}
                      max={MEMORY_LIMIT_MB.max}
                      step={64}
                      allowDecimal={false}
                      {...form.getInputProps('memoryLimit')}
                    />
                  </SimpleGrid>
                </Section>
                <Section title={t('problems.section.scoring')}>
                  <ChoiceGroup
                    label={t('problems.scoringMode')}
                    options={SCORING_MODES}
                    i18nPrefix="problems.scoring"
                    value={form.values.scoringMode}
                    onChange={(v) => form.setFieldValue('scoringMode', v)}
                  />
                </Section>
                <Section title={t('problems.languages')} description={t('problems.languagesHint')}>
                  <Group gap="xs">
                    <Button size="xs" variant="light" onClick={() => form.setFieldValue('languageKeys', languageOptions.filter((l) => l.is_enabled).map((l) => l.key))}>
                      {t('problems.selectAllLanguages')}
                    </Button>
                    <Button size="xs" variant="default" onClick={() => form.setFieldValue('languageKeys', [])}>
                      {t('problems.clearLanguages')}
                    </Button>
                    <Text size="xs" c="dimmed">
                      {t('problems.languagesSelected', { count: form.values.languageKeys.length })}
                    </Text>
                  </Group>
                  <Checkbox.Group {...form.getInputProps('languageKeys')}>
                    <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="xs" mt="xs">
                      {languageOptions.map((l) => (
                        <Checkbox
                          key={l.key}
                          value={l.key}
                          label={
                            <Group gap={6} wrap="nowrap">
                              <span>{l.name}</span>
                              {!l.is_enabled && (
                                <Badge size="xs" color="gray" variant="light">
                                  {t('problems.languageDisabled')}
                                </Badge>
                              )}
                            </Group>
                          }
                        />
                      ))}
                    </SimpleGrid>
                  </Checkbox.Group>
                </Section>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="access" pt="lg">
              <Stack>
                <Section title={t('problems.visibility')} description={t('problems.visibilityHint')}>
                  <SegmentedControl
                    w={{ base: '100%', sm: 320 }}
                    disabled={!problem.can_change_visibility}
                    data={[
                      { value: 'private', label: t('problems.private') },
                      { value: 'public', label: t('problems.public') },
                    ]}
                    {...form.getInputProps('visibility')}
                  />
                  {!problem.can_change_visibility && (
                    <Text size="xs" c="dimmed">
                      {t('problems.visibilityAdminOnly')}
                    </Text>
                  )}
                </Section>
                <Section title={t('problems.section.staff')} description={t('problems.section.staffHint')}>
                  {MEMBER_FIELDS.map((field) => (
                    <TagsInput
                      key={field}
                      label={t(`problems.${field}`)}
                      description={t(`problems.${field}Hint`)}
                      splitChars={[',', ' ']}
                      clearable
                      {...form.getInputProps(field)}
                    />
                  ))}
                </Section>
                <Section title={t('problems.section.policies')}>
                  <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    <ChoiceGroup
                      label={t('problems.sourceVisibility')}
                      options={SOURCE_VISIBILITIES}
                      i18nPrefix="problems.source"
                      value={form.values.sourceVisibility}
                      onChange={(v) => form.setFieldValue('sourceVisibility', v)}
                    />
                    <ChoiceGroup
                      label={t('problems.testcaseVisibility')}
                      options={TESTCASE_VISIBILITIES}
                      i18nPrefix="problems.testcase"
                      value={form.values.testcaseVisibility}
                      onChange={(v) => form.setFieldValue('testcaseVisibility', v)}
                    />
                    <ChoiceGroup
                      label={t('problems.testcaseResultVisibility')}
                      options={TESTCASE_RESULT_VISIBILITIES}
                      i18nPrefix="problems.testcaseResult"
                      value={form.values.testcaseResultVisibility}
                      onChange={(v) => form.setFieldValue('testcaseResultVisibility', v)}
                    />
                  </SimpleGrid>
                </Section>
                {problem.can_delete && (
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
            </Tabs.Panel>

            <Tabs.Panel value="solution" pt="lg">
              <SolutionEditor code={problem.code} />
            </Tabs.Panel>
          </Tabs>
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

/** The editorial tab: its own content and its own save button, independent of the problem form. */
function SolutionEditor({ code }: { code: string }) {
  const { t } = useTranslation()
  const solution = useSolution(code, true)
  const save = useSaveSolution(code)
  const remove = useDeleteSolution(code)
  const missing = solution.error instanceof ApiError && solution.error.status === 404
  const [content, setContent] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState<boolean | null>(null)
  const [publishAt, setPublishAt] = useState<Date | null | undefined>(undefined)

  if (solution.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }
  if (solution.isError && !missing) {
    return <Alert color="red">{t(`errors.${errorCode(solution.error)}`)}</Alert>
  }

  const current = {
    content: content ?? solution.data?.content_md ?? '',
    isPublic: isPublic ?? solution.data?.is_public ?? false,
    publishAt: publishAt !== undefined ? publishAt : solution.data?.publish_at ? new Date(solution.data.publish_at) : null,
  }
  const dirty = content !== null || isPublic !== null || publishAt !== undefined
  const reset = () => {
    setContent(null)
    setIsPublic(null)
    setPublishAt(undefined)
  }

  const onSave = () =>
    save.mutate(
      { content_md: current.content, is_public: current.isPublic, publish_at: current.publishAt?.toISOString() ?? null },
      {
        onSuccess: () => {
          reset()
          notifications.show({ color: 'green', message: t('solution.saved') })
        },
        onError: (e) => notifications.show({ color: 'red', message: t(`errors.${errorCode(e)}`) }),
      },
    )

  return (
    <Stack>
      <Card withBorder padding="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Group gap="lg" align="flex-end" wrap="wrap">
            <Switch
              label={t('solution.public')}
              description={t('solution.publicHint')}
              checked={current.isPublic}
              onChange={(e) => setIsPublic(e.currentTarget.checked)}
            />
            <DateTimePicker
              label={t('solution.publishAt')}
              description={t('solution.publishAtHint')}
              clearable
              valueFormat="DD/MM/YYYY HH:mm"
              w={260}
              value={current.publishAt}
              onChange={(v) => setPublishAt(v ? new Date(v) : null)}
            />
          </Group>
          <Group gap="sm">
            {solution.data && (
              <Badge variant="light" color={solution.data.is_visible ? 'green' : 'gray'}>
                {solution.data.is_visible ? t('solution.visibleNow') : t('solution.hiddenNow')}
              </Badge>
            )}
            {solution.data && (
              <Button
                variant="default"
                color="red"
                leftSection={<IconTrash size={16} />}
                loading={remove.isPending}
                onClick={() => remove.mutate(undefined, { onSuccess: reset })}
              >
                {t('solution.delete')}
              </Button>
            )}
            <Button leftSection={<IconDeviceFloppy size={16} />} onClick={onSave} loading={save.isPending} disabled={!dirty}>
              {solution.data ? t('common.save') : t('solution.create')}
            </Button>
          </Group>
        </Group>
      </Card>
      <MarkdownEditor
        label={t('solution.content')}
        value={current.content}
        onChange={setContent}
        uploadImage={(file) => uploadProblemImage(code, file)}
        placeholder={t('solution.placeholder')}
        height={560}
      />
    </Stack>
  )
}
