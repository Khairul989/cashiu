import RefreshToken from '#models/refresh_token'
import db from '@adonisjs/lucid/services/db'
import { RefreshToken as OAuthRefreshToken } from '@node-oauth/oauth2-server'
import { DateTime } from 'luxon'

export const revokeToken = async (token: OAuthRefreshToken): Promise<boolean> => {
  const refreshToken = await RefreshToken.query()
    // @ts-expect-error
    .preload('accessToken')
    .where('id', token.refreshToken)
    .first()

  if (!refreshToken) {
    return false
  }

  // https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/#Refresh-Token-Automatic-Reuse-Detection
  if (refreshToken.revoked) {
    const userId = refreshToken.accessToken.userId

    await db
      .query()
      .from('oauth_refresh_tokens')
      .leftJoin(
        'oauth_access_tokens',
        'oauth_refresh_tokens.access_token_id',
        'oauth_access_tokens.id'
      )
      .where('oauth_access_tokens.user_id', userId)
      .update({
        'oauth_access_tokens.revoked': true,
        'oauth_access_tokens.updated_at': DateTime.local().toString(),
        'oauth_refresh_tokens.revoked': true,
      })

    return false
  }

  refreshToken.revoked = true
  await refreshToken.save()

  refreshToken.accessToken.revoked = true
  await refreshToken.accessToken.save()

  return true
}
