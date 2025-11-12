import oauthModel from '#auth/oauth/oauth_model'
import OAuth2Server from '@node-oauth/oauth2-server'

export const oauth = new OAuth2Server({
  model: oauthModel,
  allowBearerTokensInQueryString: true,
})
