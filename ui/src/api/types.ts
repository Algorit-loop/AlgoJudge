export type Role = 'superadmin' | 'admin' | 'setter' | 'user'

/** Highest first. Same ranking as the API (site/algojudge/models/user.py). */
export const ROLES: Role[] = ['superadmin', 'admin', 'setter', 'user']
const RANK: Record<Role, number> = { user: 0, setter: 1, admin: 2, superadmin: 3 }

export const isAdmin = (role: Role) => RANK[role] >= RANK.admin

/** Can `actor` change `target`'s account from the web? Only accounts ranked below you, never yourself. */
export const canManage = (actor: Role, target: Role) => RANK[target] < RANK[actor]

/** Roles `actor` may grant from the web: those ranked below them (superadmin is terminal-only). */
export const assignableRoles = (actor: Role) => ROLES.filter((r) => RANK[r] < RANK[actor])

export interface PublicUser {
  id: number
  username: string
  display_name: string
  role: Role
  created_at: string
}

export interface Me extends PublicUser {
  email: string
}

export interface AdminUserView extends Me {
  is_active: boolean
  last_login_at: string | null
}

// --- Catalog ---

export interface Language {
  key: string
  name: string
  ext: string
  is_enabled: boolean
  sort_order: number
}

/** A problem type or a problem group. */
export interface CatalogItem {
  id: number
  slug: string
  name: string
}

// --- Problems (same values as site/algojudge/models/problem.py) ---

export type Visibility = 'public' | 'private'
export type ScoringMode = 'icpc' | 'partial'
export type SourceVisibility = 'default' | 'always' | 'solved' | 'only_own'
export type TestcaseVisibility = 'always' | 'outside_contest' | 'staff_only'
export type TestcaseResultVisibility = 'all' | 'groups_only' | 'submission_only'

export const SCORING_MODES: ScoringMode[] = ['icpc', 'partial']
export const SOURCE_VISIBILITIES: SourceVisibility[] = ['default', 'always', 'solved', 'only_own']
export const TESTCASE_VISIBILITIES: TestcaseVisibility[] = ['staff_only', 'outside_contest', 'always']
export const TESTCASE_RESULT_VISIBILITIES: TestcaseResultVisibility[] = ['all', 'groups_only', 'submission_only']

export interface ProblemSummary {
  code: string
  title: string
  points: number
  scoring_mode: ScoringMode
  time_limit_ms: number
  memory_limit_kb: number
  visibility: Visibility
  published_at: string | null
  created_at: string
  group: CatalogItem | null
  types: CatalogItem[]
}

export interface ProblemDetail extends ProblemSummary {
  statement_md: string
  updated_at: string
  allowed_languages: Language[]
  creators: PublicUser[]
  has_solution: boolean
  can_edit: boolean
  can_change_visibility: boolean
  can_delete: boolean
}

/** What an editor sees (GET /problems/{code}/settings). */
export interface ProblemSettings extends ProblemDetail {
  curators: PublicUser[]
  testers: PublicUser[]
  source_visibility: SourceVisibility
  testcase_visibility: TestcaseVisibility
  testcase_result_visibility: TestcaseResultVisibility
}

export interface Solution {
  content_md: string
  is_public: boolean
  publish_at: string | null
  updated_at: string
  is_visible: boolean
}

/** Setters and above may create problems. */
export const canCreateProblems = (role: Role) => RANK[role] >= RANK.setter
