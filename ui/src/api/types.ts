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
