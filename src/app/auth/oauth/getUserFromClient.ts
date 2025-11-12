import User from '#models/user'
import { Client as OAuthClient } from '@node-oauth/oauth2-server'

export const getUserFromClient = async (client: OAuthClient): Promise<User | null> => {
  if (!client.userId) {
    return null
  }

  const user = await User.find(client.userId)

  return user ?? null
}
