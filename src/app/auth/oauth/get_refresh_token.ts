import { getFormattedClient } from '#auth/oauth/get_client'
import RefreshToken from '#models/refresh_token'
import encryption from '@adonisjs/core/services/encryption'
import { RefreshToken as OAuthRefreshToken } from '@node-oauth/oauth2-server'

export const getRefreshToken = async (refreshToken: string): Promise<OAuthRefreshToken | null> => {
  const refreshTokenData = await RefreshToken.query()
    // @ts-expect-error
    .preload('accessToken', (query) => {
      // @ts-expect-error
      query.preload('client').preload('user')
    })
    .where('id', encryption.decrypt(refreshToken) as string)
    .first()

  if (!refreshTokenData) {
    return null
  }

  const accessTokenData = refreshTokenData.accessToken
  const client = accessTokenData.client
  const user = accessTokenData.user

  return {
    refreshToken: refreshTokenData.id,
    refreshTokenExpiresAt: refreshTokenData.expiresAt.toJSDate(),
    scope: accessTokenData.scopes !== null ? accessTokenData.scopes : [],
    client: getFormattedClient(client),
    user: user,
  }
}
