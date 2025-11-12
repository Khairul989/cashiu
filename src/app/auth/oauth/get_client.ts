import { accessTokenLifetime, refreshTokenLifetime } from '#auth/oauth/oauth_model'
import Client from '#models/client'
import { Client as OAuthClient } from '@node-oauth/oauth2-server'

const grants: string[] = ['authorization_code', 'refresh_token', 'client_credentials']

export const getFormattedClient = (client: Client): OAuthClient => {
  return {
    id: client.id,
    redirectUris: client.redirect,
    grants: grants,
    accessTokenLifetime: accessTokenLifetime,
    refreshTokenLifetime: refreshTokenLifetime,
    userId: client.userId,
  }
}

export const getClient = async (
  clientId: string,
  clientSecret: string | null
): Promise<OAuthClient | null> => {
  const client =
    typeof clientSecret !== 'string'
      ? await Client.find(clientId)
      : await Client.query()
          .where('id', clientId)
          .where('secret', clientSecret as string)
          .first()

  if (!client) {
    return null
  }

  return getFormattedClient(client)
}
