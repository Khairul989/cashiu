import { SocialProviderUser } from '#types/auth'

export interface AuthenticationInterface {
  authorizeUrl: string
  accessTokenUrl: string
  redirectUri: string
  clientId: string
  scope: Array<string>

  getRedirectUrl(state: string, nonce: string): string
  getUserInfo(authCode: string, nonce: string): Promise<SocialProviderUser>
}
