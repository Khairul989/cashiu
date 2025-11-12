import encryption from '@adonisjs/core/services/encryption'
import { randomBytes } from 'node:crypto'

export const generateRefreshToken = async (): Promise<string> => {
  return encryption.encrypt(randomBytes(40).toString('hex'))
}
