import { getFormattedClient } from '#auth/oauth/get_client'
import AuthCode from '#models/auth_code'
import { AuthorizationCode } from '@node-oauth/oauth2-server'

export const getAuthCode = async (authorizationCode: string): Promise<AuthorizationCode | null> => {
  const authCode = await AuthCode.query()
    .preload('client')
    .preload('user')
    .where('id', authorizationCode)
    .first()

  if (!authCode) {
    return null
  }

  return {
    authorizationCode: authCode.id,
    expiresAt: authCode.expiresAt.toJSDate(),
    redirectUri: authCode.redirect,
    codeChallenge: authCode.codeChallenge,
    codeChallengeMethod: authCode.codeChallengeMethod,
    scope: authCode.scopes !== null ? authCode.scopes : [],
    client: getFormattedClient(authCode.client),
    user: authCode.user,
  }
}
