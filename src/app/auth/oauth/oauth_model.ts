import { generateAccessToken } from '#auth/oauth/generate_access_token'
import { generateRefreshToken } from '#auth/oauth/generate_refresh_token'
import { getAccessToken } from '#auth/oauth/get_access_token'
import { getAuthCode } from '#auth/oauth/get_auth_code'
import { getClient } from '#auth/oauth/get_client'
import { getRefreshToken } from '#auth/oauth/get_refresh_token'
import { revokeAuthCode } from '#auth/oauth/revoke_auth_code'
import { revokeToken } from '#auth/oauth/revoke_token'
import { saveAuthCode } from '#auth/oauth/save_auth_code'
import { saveToken } from '#auth/oauth/save_token'
import { validateRedirectUri } from '#auth/oauth/validate_redirect_uri'
import { getUserFromClient } from './getUserFromClient.js'

export const accessTokenLifetime: number = 60 * 60 // 1 hour
export const refreshTokenLifetime: number = 60 * 60 * 24 * 30 // 30 days
export const authCodeLifetime: number = 60 * 10 // 10 minutes

export default {
  generateAccessToken: generateAccessToken,
  generateRefreshToken: generateRefreshToken,
  getClient: getClient,
  saveAuthorizationCode: saveAuthCode,
  getAuthorizationCode: getAuthCode,
  revokeAuthorizationCode: revokeAuthCode,
  saveToken: saveToken,
  getAccessToken: getAccessToken,
  getRefreshToken: getRefreshToken,
  revokeToken: revokeToken,
  validateRedirectUri: validateRedirectUri,
  getUserFromClient: getUserFromClient,
}
