# Permissions and Roles with Inertia and Vue

This guide explains how to use the permissions and roles system with Inertia.js and Vue components in your AdonisJS application.

## Overview

The system automatically shares user permissions and roles with all Vue components through Inertia's shared data. This allows you to perform authorization checks directly in your frontend components.

## How It Works

1. **Backend**: The ACL middleware sets up the permissions system
2. **Inertia**: User permissions and roles are automatically loaded and shared with all pages
3. **Frontend**: Vue components can access permissions through composables and directives

## Available Tools

### 1. TypeScript Types

```typescript
// src/types/permissions.ts
interface Role {
  id: number
  slug: string
  title: string | null
}

interface Permission {
  id: number
  slug: string
  title: string | null
  entityType: string
  entityId: number | null
}

interface UserPermissions {
  roles: Role[]
  permissions: Permission[]
}
```

### 2. Vue Composable

The `usePermissions()` composable provides helper functions for checking permissions:

```typescript
import { usePermissions } from '~/js/usePermissions'

const { 
  hasRole, 
  hasPermission, 
  hasAnyRole, 
  hasAnyPermission, 
  hasAllRoles, 
  hasAllPermissions 
} = usePermissions()
```

### 3. Vue Directive

The `v-permission` directive allows you to conditionally show/hide elements in templates.

## Usage Examples

### Using the Composable in Vue Components

```vue
<template>
  <div>
    <!-- Check for a specific role -->
    <div v-if="hasRole('superadmin')">
      Super Admin Content
    </div>

    <!-- Check for a specific permission -->
    <div v-if="hasPermission('read', 'Withdrawal')">
      Withdrawal Read Access
    </div>

    <!-- Check for any of multiple roles -->
    <div v-if="hasAnyRole(['superadmin', 'finance'])">
      Admin or Finance Content
    </div>

    <!-- Check for all permissions -->
    <div v-if="hasAllPermissions(['read', 'update'])">
      Full Access Content
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePermissions } from '~/js/usePermissions'

const { hasRole, hasPermission, hasAnyRole, hasAllPermissions } = usePermissions()
</script>
```

### Using the Directive in Templates

```vue
<template>
  <div>
    <!-- Show for specific role -->
    <div v-permission="{ role: 'superadmin' }">
      Super Admin Content
    </div>

    <!-- Show for specific permission -->
    <div v-permission="{ permission: 'read', entityType: 'Withdrawal' }">
      Withdrawal Read Access
    </div>

    <!-- Show for any of multiple roles -->
    <div v-permission="{ roles: ['superadmin', 'finance'], requireAll: false }">
      Admin or Finance Content
    </div>

    <!-- Show only if user has ALL specified permissions -->
    <div v-permission="{ permissions: ['read', 'update'], requireAll: true }">
      Full Access Content
    </div>
  </div>
</template>
```

### Accessing Raw Permissions Data

```vue
<template>
  <div>
    <h3>User Roles:</h3>
    <ul>
      <li v-for="role in permissions.roles" :key="role.id">
        {{ role.title || role.slug }}
      </li>
    </ul>

    <h3>User Permissions:</h3>
    <ul>
      <li v-for="permission in permissions.permissions" :key="permission.id">
        {{ permission.title || permission.slug }}
        <span v-if="permission.entityType !== '*'">
          - {{ permission.entityType }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { SharedProps } from '@adonisjs/inertia/types'
import type { UserPermissions } from '../../types/permissions'

const page = usePage<SharedProps>()
const permissions = computed<UserPermissions | null>(() => {
  return page.props.permissions as UserPermissions | null
})
</script>
```

## Available Methods

### Role Checking

- `hasRole(roleSlug: string)`: Check if user has a specific role
- `hasAnyRole(roleSlugs: string[])`: Check if user has any of the specified roles
- `hasAllRoles(roleSlugs: string[])`: Check if user has all of the specified roles

### Permission Checking

- `hasPermission(permissionSlug: string, entityType?: string, entityId?: number)`: Check if user has a specific permission
- `hasAnyPermission(permissionSlugs: string[])`: Check if user has any of the specified permissions
- `hasAllPermissions(permissionSlugs: string[])`: Check if user has all of the specified permissions

## Directive Options

The `v-permission` directive accepts an object with the following properties:

- `role?: string` - Single role to check
- `roles?: string[]` - Multiple roles to check
- `permission?: string` - Single permission to check
- `permissions?: string[]` - Multiple permissions to check
- `entityType?: string` - Entity type for permission check
- `entityId?: number` - Entity ID for permission check
- `requireAll?: boolean` - Whether to require all roles/permissions (default: false)

## Best Practices

1. **Use composables for complex logic**: Use the `usePermissions()` composable in script setup for complex permission checks
2. **Use directives for simple UI**: Use the `v-permission` directive for simple show/hide logic in templates
3. **Check permissions on the backend**: Always validate permissions on the backend as well - frontend checks are for UX only
4. **Cache permission data**: The permissions are automatically cached per request, so multiple checks won't cause performance issues

## Security Notes

⚠️ **Important**: Frontend permission checks are for user experience only. Always validate permissions on the backend before performing any sensitive operations.

The frontend can be manipulated by users, so never rely solely on frontend permission checks for security.

## Example: Admin Dashboard

Here's how you might use permissions in an admin dashboard:

```vue
<template>
  <div class="admin-dashboard">
    <!-- Navigation based on roles -->
    <nav>
      <a v-if="hasRole('superadmin')" href="/admin/users">User Management</a>
      <a v-if="hasAnyRole(['superadmin', 'finance'])" href="/admin/withdrawals">Withdrawals</a>
      <a v-if="hasPermission('read', 'Conversion')" href="/admin/conversions">Conversions</a>
    </nav>

    <!-- Content sections -->
    <div v-permission="{ role: 'superadmin' }" class="admin-section">
      <h2>System Settings</h2>
      <!-- Super admin only content -->
    </div>

    <div v-permission="{ permission: 'read', entityType: 'Withdrawal' }" class="admin-section">
      <h2>Withdrawal Management</h2>
      <!-- Withdrawal read permission content -->
    </div>

    <div v-permission="{ permission: 'update', entityType: 'Withdrawal' }" class="admin-section">
      <h2>Process Withdrawals</h2>
      <!-- Withdrawal update permission content -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePermissions } from '~/js/usePermissions'

const { hasRole, hasPermission, hasAnyRole } = usePermissions()
</script>
```

This system provides a clean, type-safe way to handle permissions and roles in your Vue components while maintaining good separation of concerns. 