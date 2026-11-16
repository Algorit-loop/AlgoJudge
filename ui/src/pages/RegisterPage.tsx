import { Alert, Button, Center, Loader, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconLock } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'

import { useMe, useRegister, useRegistrationInfo } from '../api/auth'
import { ApiError, errorCode } from '../api/client'
import { AuthCard } from './AuthCard'

// Same rules as the API (site/algojudge/api/schemas.py).
const USERNAME_RE = /^[A-Za-z0-9_]{3,32}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FormValues {
  username: string
  email: string
  display_name: string
  password: string
  confirm: string
}

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: me } = useMe()
  const registration = useRegistrationInfo()
  const register = useRegister()

  const form = useForm<FormValues>({
    initialValues: { username: '', email: '', display_name: '', password: '', confirm: '' },
    validate: {
      username: (v) => (USERNAME_RE.test(v.trim()) ? null : t('validation.usernameFormat')),
      email: (v) => (EMAIL_RE.test(v.trim()) ? null : t('validation.emailFormat')),
      display_name: (v) => (v.trim().length <= 64 ? null : t('validation.displayNameLength')),
      password: (v) => (v.length >= 8 && v.length <= 128 ? null : t('validation.passwordLength')),
      confirm: (v, values) => (v === values.password ? null : t('validation.passwordMismatch')),
    },
  })

  if (me && !register.isSuccess) return <Navigate to="/" replace />

  const onSubmit = form.onSubmit((values) =>
    register.mutate(
      {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        display_name: values.display_name.trim() || undefined,
      },
      {
        onSuccess: (user) => {
          notifications.show({ color: 'green', message: t('auth.welcome', { name: user.display_name }) })
          void navigate('/', { replace: true })
        },
        onError: (error) => {
          // Show "username taken" etc. under the field it concerns.
          if (error instanceof ApiError && error.field && error.field in form.values) {
            form.setFieldError(error.field, t(`errors.${error.code}`))
          }
        },
      },
    ),
  )

  const fieldError = register.error instanceof ApiError && register.error.field
  const closed = registration.data?.registration_open === false

  return (
    <AuthCard
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      linkLabel={t('nav.login')}
      linkTo="/login"
    >
      {registration.isPending ? (
        <Center py="md">
          <Loader size="sm" />
        </Center>
      ) : closed ? (
        <Alert color="yellow" icon={<IconLock size={18} />}>
          {t('auth.registrationClosed')}
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <Stack>
            {register.isError && !fieldError && (
              <Alert color="red" icon={<IconAlertCircle size={18} />}>
                {t(`errors.${errorCode(register.error)}`)}
              </Alert>
            )}
            <TextInput
              label={t('auth.username')}
              description={t('auth.usernameHint')}
              autoComplete="username"
              autoFocus
              required
              {...form.getInputProps('username')}
            />
            <TextInput
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              required
              {...form.getInputProps('email')}
            />
            <TextInput
              label={t('auth.displayName')}
              description={t('auth.displayNameHint')}
              autoComplete="name"
              {...form.getInputProps('display_name')}
            />
            <PasswordInput
              label={t('auth.password')}
              description={t('auth.passwordHint')}
              autoComplete="new-password"
              required
              {...form.getInputProps('password')}
            />
            <PasswordInput
              label={t('auth.confirmPassword')}
              autoComplete="new-password"
              required
              {...form.getInputProps('confirm')}
            />
            <Button type="submit" fullWidth loading={register.isPending}>
              {t('auth.submitRegister')}
            </Button>
          </Stack>
        </form>
      )}
    </AuthCard>
  )
}
