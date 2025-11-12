import { generateJwtSecretKey } from '#auth/oauth/generate_jwt_secret_key'
import { accessTokenLifetime } from '#auth/oauth/oauth_model'
import { Client, User } from '@node-oauth/oauth2-server'
import { randomBytes } from 'crypto'
import JWT from 'jsonwebtoken'
import { DateTime } from 'luxon'

export const generateAccessToken = async (
  client: Client,
  user: User,
  scope: String[] | String | null
): Promise<string> => {
  return JWT.sign(
    {
      jti: randomBytes(40).toString('hex'),
      scope: scope,
      nbf: DateTime.local().toSeconds(),
      iss: 'AuthenticationService',
      sub: user.id,
    },
    generateJwtSecretKey(client.id),
    { expiresIn: accessTokenLifetime }
  )
}
