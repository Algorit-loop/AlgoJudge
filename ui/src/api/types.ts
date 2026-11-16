export type Role = 'admin' | 'setter' | 'user'

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
