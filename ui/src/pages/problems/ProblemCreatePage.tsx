import { Alert, Button, Card, Container, Group, NumberInput, Stack, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAlertCircle } from '../../icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { ApiError, errorCode } from '../../api/client'
import { useCreateProblem } from '../../api/problems'
import { MEMORY_LIMIT_MB, mbToKb, PROBLEM_CODE_RE, secondsToMs, TIME_LIMIT_SECONDS } from './limits'

interface FormValues {
  code: string
  title: string
  timeLimit: number
  memoryLimit: number
}

export function ProblemCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateProblem()

  const form = useForm<FormValues>({
    initialValues: { code: '', title: '', timeLimit: 1, memoryLimit: 256 },
    validate: {
      code: (v) => (PROBLEM_CODE_RE.test(v) ? null : t('problems.codeFormat')),
      title: (v) => (v.trim() ? null : t('validation.required')),
      timeLimit: (v) => (v >= TIME_LIMIT_SECONDS.min && v <= TIME_LIMIT_SECONDS.max ? null : t('problems.timeRange')),
      memoryLimit: (v) => (v >= MEMORY_LIMIT_MB.min && v <= MEMORY_LIMIT_MB.max ? null : t('problems.memoryRange')),
    },
  })

  const onSubmit = form.onSubmit((v) =>
    create.mutate(
      {
        code: v.code,
        title: v.title.trim(),
        time_limit_ms: secondsToMs(v.timeLimit),
        memory_limit_kb: mbToKb(v.memoryLimit),
      },
      {
        onSuccess: (p) => void navigate(`/problems/${p.code}/edit`, { replace: true }),
        onError: (e) => {
          if (e instanceof ApiError && e.field && e.field in form.values) {
            form.setFieldError(e.field, t(`errors.${e.code}`))
          }
        },
      },
    ),
  )

  const fieldError = create.error instanceof ApiError && create.error.field

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={2}>{t('problems.createTitle')}</Title>
        <Card withBorder padding="xl">
          <form onSubmit={onSubmit} noValidate>
            <Stack>
              {create.isError && !fieldError && (
                <Alert color="red" icon={<IconAlertCircle size={18} />}>
                  {t(`errors.${errorCode(create.error)}`)}
                </Alert>
              )}
              <TextInput
                label={t('problems.code')}
                description={t('problems.codeHint')}
                required
                autoFocus
                ff="monospace"
                {...form.getInputProps('code')}
                onChange={(e) => form.setFieldValue('code', e.currentTarget.value.toLowerCase())}
              />
              <TextInput label={t('problems.name')} required {...form.getInputProps('title')} />
              <Group grow>
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
              </Group>
              <Group justify="flex-end">
                <Button variant="default" onClick={() => void navigate(-1)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" loading={create.isPending}>
                  {t('problems.createSubmit')}
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  )
}
