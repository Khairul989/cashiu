import AuthCode from '#models/auth_code'
import { AuthorizationCode } from '@node-oauth/oauth2-server'

export const revokeAuthCode = async (code: AuthorizationCode): Promise<boolean> => {
  const authCode = await AuthCode.find(code.authorizationCode)

  if (!authCode || authCode.revoked) {
    return false
  }

  authCode.revoked = true
  await authCode.save()

  return true
}
