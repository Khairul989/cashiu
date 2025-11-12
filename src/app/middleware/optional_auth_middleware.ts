import { Authenticators } from '@adonisjs/auth/types'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class OptionalAuthMiddleware {
  redirectTo = '/auth/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    if (
      ctx.request.header('Authorization') ||
      ctx.request.header('api-key') ||
      options.guards?.filter((guard) => guard.includes('web'))
    ) {
      await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
    }

    return next()
  }
}
