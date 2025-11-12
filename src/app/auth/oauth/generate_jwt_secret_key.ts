import config from '@adonisjs/core/services/config'
import { createHash } from 'crypto'

export const generateJwtSecretKey = (clientId: string): string => {
  return createHash('sha256')
    .update(`${clientId}:${config.get('app.appKey')}`)
    .digest('hex')
}
