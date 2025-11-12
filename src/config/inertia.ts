import User from '#models/user'
import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps, PageProps } from '@adonisjs/inertia/types'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    user: (ctx) => ctx.auth?.user,
    errors: (ctx) => ctx.session?.flashMessages.get('errors'),
    flash: (ctx) => ({
      success: ctx.session?.flashMessages.get('success'),
      error: ctx.session?.flashMessages.get('error'),
      warning: ctx.session?.flashMessages.get('warning'),
      info: ctx.session?.flashMessages.get('info'),
    }),
    permissions: async (ctx) => {
      if (!ctx.auth?.user) return null

      const user = ctx.auth.user as User
      const roles = await user.roles()
      const permissions = await user.permissions()

      return {
        roles: roles.map((role: any) => ({
          id: role.id,
          slug: role.slug,
          title: role.title,
        })),
        permissions: permissions.map((permission: any) => ({
          id: permission.id,
          slug: permission.slug,
          title: permission.title,
          entityType: permission.entityType,
          entityId: permission.entityId,
        })),
      }
    },
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: false,
    entrypoint: 'inertia/app/ssr.ts',
  },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig>, PageProps {}
}
