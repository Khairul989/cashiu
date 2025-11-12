import { SharedProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import type { Permission, PermissionCheck, Role, UserPermissions } from '../../types/permissions.js'

export function usePermissions(): PermissionCheck {
  const page = usePage<SharedProps>()

  const permissions = computed<UserPermissions | null>(() => {
    return page.props.permissions as UserPermissions | null
  })

  const hasRole = (roleSlug: string): boolean => {
    if (!permissions.value) return false
    return permissions.value.roles.some((role: Role) => role.slug === roleSlug)
  }

  const hasPermission = (
    permissionSlug: string,
    entityType?: string,
    entityId?: number
  ): boolean => {
    if (!permissions.value) return false

    return permissions.value.permissions.some((permission: Permission) => {
      const slugMatch = permission.slug === permissionSlug
      const entityTypeMatch =
        !entityType ||
        permission.entityType.toLowerCase().includes(entityType.toLowerCase()) ||
        permission.entityType === '*'
      const entityIdMatch =
        !entityId || permission.entityId === entityId || permission.entityId === null

      return slugMatch && entityTypeMatch && entityIdMatch
    })
  }

  const hasAnyRole = (roleSlugs: string[]): boolean => {
    return roleSlugs.some((roleSlug) => hasRole(roleSlug))
  }

  const hasAnyPermission = (permissionSlugs: string[]): boolean => {
    return permissionSlugs.some((permissionSlug) => hasPermission(permissionSlug))
  }

  const hasAllRoles = (roleSlugs: string[]): boolean => {
    return roleSlugs.every((roleSlug) => hasRole(roleSlug))
  }

  const hasAllPermissions = (permissionSlugs: string[]): boolean => {
    return permissionSlugs.every((permissionSlug) => hasPermission(permissionSlug))
  }

  const isSuperAdmin = (): boolean => {
    return hasRole('superadmin')
  }

  return {
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,
    hasAllRoles,
    hasAllPermissions,
    isSuperAdmin,
  }
}
