import AccessToken from '#models/access_token'
import RefreshToken from '#models/refresh_token'
import { JwtPayload } from '#types/auth'
import encryption from '@adonisjs/core/services/encryption'
import { Client, Token, User } from '@node-oauth/oauth2-server'
import JWT from 'jsonwebtoken'
import { DateTime } from 'luxon'

export const saveToken = async (token: Token, client: Client, user: User): Promise<Token> => {
  const decodedJwt = JWT.decode(token.accessToken) as JwtPayload

  const accessToken = await AccessToken.create({
    id: decodedJwt.jti,
    userId: user.id,
    clientId: client.id,
    scopes: token.scope,
    revoked: false,
    expiresAt: token.accessTokenExpiresAt
      ? DateTime.fromJSDate(token.accessTokenExpiresAt)
      : undefined,
    createdAt: DateTime.local(),
    updatedAt: DateTime.local(),
  })

  if (token.refreshToken) {
    const decryptedRefreshToken = encryption.decrypt(token.refreshToken)

    if (!decryptedRefreshToken) {
      throw new Error('invalid refresh token')
    }

    await RefreshToken.create({
      id: decryptedRefreshToken as string,
      accessTokenId: accessToken.id,
      revoked: false,
      expiresAt: token.refreshTokenExpiresAt
        ? DateTime.fromJSDate(token.refreshTokenExpiresAt)
        : undefined,
    })
  }

  return {
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    scope: token.scope,
    client: client,
    user: user,
  }
}
