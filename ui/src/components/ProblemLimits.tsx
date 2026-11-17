import { Badge, Group } from '@mantine/core'
import { IconClock, IconCpu } from '../icons'
import { useTranslation } from 'react-i18next'

import { formatMegabytes, formatSeconds } from '../format'

export function ProblemLimits({ timeMs, memoryKb }: { timeMs: number; memoryKb: number }) {
  const { t } = useTranslation()
  return (
    <Group gap="xs">
      <Badge variant="light" color="gray" tt="none" leftSection={<IconClock size={12} />}>
        {t('problems.timeLimitValue', { value: formatSeconds(timeMs) })}
      </Badge>
      <Badge variant="light" color="gray" tt="none" leftSection={<IconCpu size={12} />}>
        {t('problems.memoryLimitValue', { value: formatMegabytes(memoryKb) })}
      </Badge>
    </Group>
  )
}
