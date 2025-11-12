import { AuthenticationInterface } from '#services/authentication/authentication_interface'
import env from '#start/env'
import { AppleAccessToken, AppleTokenDecoded, SocialProviderUser } from '#types/auth'
import { SignJWT } from 'jose'
import JWT from 'jsonwebtoken'
import JWKS, { CertSigningKey, RsaSigningKey } from 'jwks-rsa'
import { createPrivateKey } from 'node:crypto'

export class AppleLoginService implements AuthenticationInterface {
  authorizeUrl = 'https://appleid.apple.com/auth/authorize'
  accessTokenUrl = 'https://appleid.apple.com/auth/token'

  redirectUri
  clientId
  teamId
  privateKey
  keyId

  name: string | null = null
  scope = ['name', 'email']

  constructor() {
    this.redirectUri = env.get('APPLE_CALLBACK_URL') as string
    this.clientId = env.get('APPLE_CLIENT_ID') as string
    this.teamId = env.get('APPLE_TEAM_ID') as string
    this.keyId = env.get('APPLE_KEY_ID') as string
    this.privateKey = Buffer.from(env.get('APPLE_PRIVATE_KEY') as string, 'base64').toString(
      'utf-8'
    )
  }

  getRedirectUrl(state: string, nonce: string): string {
    const params = {
      response_type: 'code',
      response_mode: 'form_post',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope.join(' '),
      state,
      nonce,
    }

    const paramString = Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&')

    return `${this.authorizeUrl}?${paramString}`
  }

  setFirstAndLastName(name: string | null): void {
    this.name = name?.trim() || null
  }

  async getUserInfo(authCode: string, nonce: string): Promise<SocialProviderUser> {
    const clientSecret = await this.generateClientSecret()

    const formData = new URLSearchParams({
      code: authCode,
      client_id: this.clientId,
      client_secret: clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    })

    const response = await fetch(this.accessTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const result = (await response.json()) as AppleAccessToken
    const token = result.id_token

    const signingKey = await this.getAppleSigningKey(token)
    const decodedUser = JWT.verify(token, signingKey, {
      issuer: 'https://appleid.apple.com',
      audience: this.clientId,
    }) as AppleTokenDecoded

    if (decodedUser.nonce_supported && decodedUser.nonce !== nonce) {
      throw new Error('Invalid nonce')
    }

    return {
      id: decodedUser.sub,
      email: decodedUser.email,
      name: this.name || null,
      avatarUrl: null,
    }
  }

  /**
   * Generates Client Secret
   * https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
   * @returns clientSecret
   */
  async generateClientSecret(): Promise<string> {
    // Expires in: 1 hour
    const expirationTime = Math.ceil(Date.now() / 1000) + 3600

    return await new SignJWT({})
      .setAudience('https://appleid.apple.com')
      .setIssuer(this.teamId)
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .setSubject(this.clientId)
      .setProtectedHeader({ alg: 'ES256', kid: this.keyId })
      .sign(createPrivateKey(this.privateKey.replace(/\\n/g, '\n')))
  }

  async getAppleSigningKey(token: string): Promise<string> {
    const decodedToken = JWT.decode(token, { complete: true })
    const key = await JWKS({
      rateLimit: true,
      cache: true,
      cacheMaxEntries: 100,
      cacheMaxAge: 1000 * 60 * 60 * 24,
      jwksUri: 'https://appleid.apple.com/auth/keys',
    }).getSigningKey(decodedToken?.header.kid)

    return (key as CertSigningKey)?.publicKey || (key as RsaSigningKey)?.rsaPublicKey
  }
}
