import User from '#models/user';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import { LucidModel } from '@adonisjs/lucid/types/model';

export default class AclMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { permissions: string[]; target?: LucidModel }
  ) {
    if (!ctx.auth.user) {
      ctx.response.abort({ message: 'Unauthorized' }, 403)
    }

    const user = ctx.auth.user as User

    if (!(await user.hasRole('superadmin'))) {
      const hasPermission = await user.hasAnyPermission(options.permissions, options.target)

      if (!hasPermission) {
        ctx.session.flash('error', 'No permission to view the page')

        return ctx.response.redirect().back()
      }
    }

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}
