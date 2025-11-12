import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class IsAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user as User | undefined

    if (!user?.isAdmin) {
      return ctx.response.unauthorized({ message: 'Unauthorized' })
    }

    return next()
  }
}
