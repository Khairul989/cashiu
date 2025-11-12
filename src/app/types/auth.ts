export type JwtPayload = {
  jti: string
  scope: string | string[] | null
  nbf: number
  iss: string
}

export type SocialProviderUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export type SocialProviderToken = {
  access_token: string
  token_type: string
  expires_in: number
  id_token: string
}

export type AppleAccessToken = SocialProviderToken & {
  refresh_token: string
}

export type AppleTokenDecoded = {
  iss: string
  aud: string
  exp: number
  iat: number
  sub: string
  at_hash: string
  email: string
  email_verified: 'true' | 'false'
  is_private_email: boolean
  auth_time: number
  nonce_supported: boolean
  nonce: string | null
}

export type GoogleAccessToken = SocialProviderToken & {
  scope: string
}

export type GoogleUserInfo = {
  sub: string
  email: string
  nonce: string
  name: string
  picture: string
}
