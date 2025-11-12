import type { Authenticators } from '@adonisjs/auth/types'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/auth/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    // Save the intended URL to redirect to after login
    if (!ctx.request.url(true).includes('/auth/logout')) {
      ctx.session.put('intended', ctx.request.url(true))
    }

    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    return next()
  }
}
