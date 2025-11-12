import type { Directive, DirectiveBinding } from 'vue'
import { usePermissions } from './usePermissions.js'

interface PermissionBindingValue {
  role?: string
  roles?: string[]
  permission?: string
  permissions?: string[]
  entityType?: string
  entityId?: number
  requireAll?: boolean
}

export const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionBindingValue>) {
    const { hasRole, hasPermission, hasAnyRole, hasAnyPermission, hasAllRoles, hasAllPermissions } = usePermissions()
    
    const value = binding.value || {}
    let hasAccess = false

    // Check roles
    if (value.role) {
      hasAccess = hasRole(value.role)
    } else if (value.roles) {
      hasAccess = value.requireAll ? hasAllRoles(value.roles) : hasAnyRole(value.roles)
    }
    
    // Check permissions
    if (value.permission) {
      hasAccess = hasPermission(value.permission, value.entityType, value.entityId)
    } else if (value.permissions) {
      hasAccess = value.requireAll 
        ? hasAllPermissions(value.permissions) 
        : hasAnyPermission(value.permissions)
    }

    // Hide element if no access
    if (!hasAccess) {
      el.style.display = 'none'
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<PermissionBindingValue>) {
    const { hasRole, hasPermission, hasAnyRole, hasAnyPermission, hasAllRoles, hasAllPermissions } = usePermissions()
    
    const value = binding.value || {}
    let hasAccess = false

    // Check roles
    if (value.role) {
      hasAccess = hasRole(value.role)
    } else if (value.roles) {
      hasAccess = value.requireAll ? hasAllRoles(value.roles) : hasAnyRole(value.roles)
    }
    
    // Check permissions
    if (value.permission) {
      hasAccess = hasPermission(value.permission, value.entityType, value.entityId)
    } else if (value.permissions) {
      hasAccess = value.requireAll 
        ? hasAllPermissions(value.permissions) 
        : hasAnyPermission(value.permissions)
    }

    // Show/hide element based on access
    el.style.display = hasAccess ? '' : 'none'
  }
} 