export interface Role {
  id: number
  slug: string
  title: string | null
}

export interface Permission {
  id: number
  slug: string
  title: string | null
  entityType: string
  entityId: number | null
}

export interface UserPermissions {
  roles: Role[]
  permissions: Permission[]
}

// Helper types for checking permissions
export interface PermissionCheck {
  hasRole: (roleSlug: string) => boolean
  hasPermission: (permissionSlug: string, entityType?: string, entityId?: number) => boolean
  hasAnyRole: (roleSlugs: string[]) => boolean
  hasAnyPermission: (permissionSlugs: string[]) => boolean
  hasAllRoles: (roleSlugs: string[]) => boolean
  hasAllPermissions: (permissionSlugs: string[]) => boolean
  isSuperAdmin: () => boolean
} 