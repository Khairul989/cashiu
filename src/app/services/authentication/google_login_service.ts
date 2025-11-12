import { AuthenticationInterface } from '#services/authentication/authentication_interface'
import env from '#start/env'
import { GoogleAccessToken, GoogleUserInfo, SocialProviderUser } from '#types/auth'

export class GoogleLoginService implements AuthenticationInterface {
  authorizeUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  accessTokenUrl = 'https://oauth2.googleapis.com/token'
  redirectUri
  clientId
  clientSecret

  scope = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ]

  constructor() {
    this.redirectUri = env.get('GOOGLE_CALLBACK_URL') as string
    this.clientId = env.get('GOOGLE_CLIENT_ID') as string
    this.clientSecret = env.get('GOOGLE_CLIENT_SECRET') as string
  }

  getRedirectUrl(state: string, nonce: string): string {
    const params = new URLSearchParams({
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      response_type: 'code',
      include_granted_scopes: 'true',
      scope: this.scope.join(' '),
      state,
      nonce,
    })

    return `${this.authorizeUrl}?${params.toString()}`
  }

  async getUserInfo(authCode: string, nonce: string): Promise<SocialProviderUser> {
    const data = new URLSearchParams({
      code: authCode,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    })

    const response = await fetch(this.accessTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data.toString(),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const token = (await response.json()) as GoogleAccessToken

    const userInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token.id_token}`
    )

    if (!userInfoResponse.ok) {
      throw new Error(`HTTP error! Status: ${userInfoResponse.status}`)
    }

    const userInfo = (await userInfoResponse.json()) as GoogleUserInfo

    if (userInfo.nonce !== nonce) {
      throw new Error('Invalid nonce')
    }

    return {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || null,
      avatarUrl: userInfo.picture || null,
    }
  }
}
