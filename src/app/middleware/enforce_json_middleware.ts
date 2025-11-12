import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class EnforceJsonMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const headers = ctx.request.headers()
    headers.accept = 'application/json'

    return next()
  }
}
