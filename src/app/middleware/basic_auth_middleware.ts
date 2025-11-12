import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class BasicAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // Get the Authorization header
    const authHeader = request.header('authorization')
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return response.status(401).header('WWW-Authenticate', 'Basic').send('Unauthorized')
    }

    // Decode base64 credentials
    const base64Credentials = authHeader.replace('Basic ', '')
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
    const [username, password] = credentials.split(':')

    // Check credentials
    if (username !== 'admin' || password !== 'cashbackapp-rockme') {
      return response.status(401).header('WWW-Authenticate', 'Basic').send('Unauthorized')
    }

    // Proceed to next middleware or controller
    await next()
  }
}
