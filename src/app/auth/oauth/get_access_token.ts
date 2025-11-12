import { generateJwtSecretKey } from '#auth/oauth/generate_jwt_secret_key'
import { getFormattedClient } from '#auth/oauth/get_client'
import AccessToken from '#models/access_token'
import { JwtPayload } from '#types/auth'
import { Token } from '@node-oauth/oauth2-server'
import JWT from 'jsonwebtoken'
import { DateTime } from 'luxon'

export const getAccessToken = async (accessToken: string): Promise<Token | null> => {
  const decodedJwt = JWT.decode(accessToken) as JwtPayload

  const accessTokenData = await AccessToken.query()
    .preload('client')
    .preload('refreshToken')
    .preload('user')
    .where('id', decodedJwt.jti)
    .where('revoked', false)
    .where('expiresAt', '>', DateTime.local().toString())
    .first()

  if (!accessTokenData) {
    return null
  }

  // Verify the JWT
  JWT.verify(accessToken, generateJwtSecretKey(accessTokenData.clientId))

  return {
    accessToken: accessTokenData.id,
    accessTokenExpiresAt: accessTokenData.expiresAt.toJSDate(),
    scope: accessTokenData.scopes !== null ? accessTokenData.scopes : [],
    client: getFormattedClient(accessTokenData.client),
    user: accessTokenData.user,
  }
}
