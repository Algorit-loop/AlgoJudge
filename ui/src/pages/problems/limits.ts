// Same ranges as the API (site/algojudge/models/problem.py), shown to the user in seconds and MB.
export const TIME_LIMIT_SECONDS = { min: 0.1, max: 20 }
export const MEMORY_LIMIT_MB = { min: 16, max: 2048 }
export const PROBLEM_CODE_RE = /^[a-z0-9_]{2,32}$/

export const secondsToMs = (s: number) => Math.round(s * 1000)
export const mbToKb = (mb: number) => Math.round(mb * 1024)
