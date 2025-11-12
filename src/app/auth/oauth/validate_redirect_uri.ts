import { Client } from '@node-oauth/oauth2-server'

export const validateRedirectUri = async (
  redirectUri: string,
  client: Client
): Promise<boolean> => {
  return client.redirectUris?.includes(redirectUri) || false
}
