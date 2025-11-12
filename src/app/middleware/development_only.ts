import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware that only allows access when NODE_ENV is set to development
 */
export default class DevelopmentOnlyMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    // Check if the environment is development
    if (env.get('SWAGGER', 'true') === 'true') {
      // Allow access in development environment
      return next()
    }

    // Block access in non-development environments
    return response.forbidden({ error: 'Access denied in non-development environment' })
  }
}
