import { Alert, Button, Checkbox, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle } from '../icons'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useSearchParams } from 'react-router'

import { type LoginInput, useLogin, useMe } from '../api/auth'
import { errorCode } from '../api/client'
import { AuthCard, safeNext } from './AuthCard'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const { data: me } = useMe()
  const login = useLogin()

  const form = useForm<LoginInput>({
    initialValues: { login: '', password: '', remember: true },
    validate: {
      login: (v) => (v.trim() ? null : t('validation.required')),
      password: (v) => (v ? null : t('validation.required')),
    },
  })

  if (me && !login.isSuccess) return <Navigate to={next} replace />

  const onSubmit = form.onSubmit((values) =>
    login.mutate(values, {
      onSuccess: (user) => {
        notifications.show({ color: 'green', message: t('auth.welcome', { name: user.display_name }) })
        void navigate(next, { replace: true })
      },
    }),
  )

  return (
    <AuthCard
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      linkLabel={t('nav.register')}
      linkTo="/register"
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack>
          {login.isError && (
            <Alert color="red" icon={<IconAlertCircle size={18} />}>
              {t(`errors.${errorCode(login.error)}`)}
            </Alert>
          )}
          <TextInput
            label={t('auth.login')}
            autoComplete="username"
            autoFocus
            required
            {...form.getInputProps('login')}
          />
          <PasswordInput
            label={t('auth.password')}
            autoComplete="current-password"
            required
            {...form.getInputProps('password')}
          />
          <Checkbox label={t('auth.remember')} {...form.getInputProps('remember', { type: 'checkbox' })} />
          <Button type="submit" fullWidth loading={login.isPending}>
            {t('auth.submitLogin')}
          </Button>
        </Stack>
      </form>
    </AuthCard>
  )
}
