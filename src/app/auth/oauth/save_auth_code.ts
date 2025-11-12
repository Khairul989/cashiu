import { getFormattedClient } from '#auth/oauth/get_client'
import { authCodeLifetime } from '#auth/oauth/oauth_model'
import AuthCode from '#models/auth_code'
import { AuthorizationCode, Client, User } from '@node-oauth/oauth2-server'
import { DateTime } from 'luxon'

export const saveAuthCode = async (
  code: AuthorizationCode,
  client: Client,
  user: User
): Promise<AuthorizationCode> => {
  const authCode = await AuthCode.create({
    id: code.authorizationCode,
    clientId: client.id,
    userId: user.id,
    redirect: code.redirectUri,
    scopes: code.scope,
    revoked: false,
    codeChallenge: code.codeChallenge,
    codeChallengeMethod: code.codeChallengeMethod,
    expiresAt: DateTime.local().plus({ seconds: authCodeLifetime }),
  })
  await authCode.load('client')

  return {
    authorizationCode: authCode.id,
    expiresAt: authCode.expiresAt.toJSDate(),
    redirectUri: code.redirectUri,
    scope: authCode.scopes !== null ? authCode.scopes : [],
    client: getFormattedClient(authCode.client),
    user: authCode.user,
  }
}
