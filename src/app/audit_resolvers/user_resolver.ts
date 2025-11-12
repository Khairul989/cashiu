import { HttpContext } from '@adonisjs/core/http'
import { UserResolver } from '@stouder-io/adonis-auditing'

export default class implements UserResolver {
  async resolve({ auth }: HttpContext): Promise<{ id: string; type: string } | null> {
    if (await auth.use('api').check()) {
      // @ts-ignore
      return { id: '' + auth.use('api').user?.id, type: 'User' }
    }

    if (await auth.use('web').check()) {
      // @ts-ignore
      return { id: '' + auth.use('web').user?.id, type: 'User' }
    }

    // @ts-ignore
    return (await auth.check()) ? { id: '' + auth.user.id, type: 'User' } : null
  }
}
