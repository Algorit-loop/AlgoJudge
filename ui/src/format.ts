const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso))

/** Up to two initials for an avatar, e.g. "Nguyễn Văn An" -> "NA". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const decimal = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

/** 1000 -> "1 giây", 1500 -> "1,5 giây" (unit text comes from i18n via the caller when needed). */
export const formatSeconds = (ms: number) => decimal.format(ms / 1000)

/** 262144 -> "256" (MB). */
export const formatMegabytes = (kb: number) => decimal.format(kb / 1024)
