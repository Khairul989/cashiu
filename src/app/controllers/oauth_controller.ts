import { oauth } from '#auth/oauth/oauth_server'
import { HttpContext } from '@adonisjs/core/http'
import sentry from '@benhepburn/adonis-sentry/service'
import { Request, Response } from '@node-oauth/oauth2-server'

export default class OAuthController {
  public async authorize({ request, response, auth }: HttpContext) {
    const normalizeHeaders = (headers: Record<string, any>): Record<string, string> => {
      return Object.entries(headers).reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value[0] : (value ?? '')
        return acc
      }, {} as Record<string, string>)
    }

    const oauthRequest = new Request({
      headers: normalizeHeaders(request.headers()),
      body: request.body(),
      method: request.method(),
      query: request.qs(),
    })
    const oauthResponse = new Response({
      body: response.getBody(),
      headers: response.getHeaders(),
      status: response.response.statusCode,
    })

    try {
      const options = {
        authenticateHandler: {
          handle: () => {
            return auth.use('web').user
          },
        },
        allowed: true,
      }

      const code = await oauth.authorize(oauthRequest, oauthResponse, options)

      await auth.use('web').logout()

      return response.redirect(
        `${code.redirectUri}?code=${code.authorizationCode}&state=${request.qs().state}`
      )
    } catch (err) {
      sentry.captureException(err)

      return response.status(err.status || 500).send(err.message)
    }
  }

  /**
   * @token
   * @tag Auth
   * @operationId token
   * @summary Get Access / Refresh Token
   * @description https://laravel.com/docs/11.x/passport#code-grant-pkce-converting-authorization-codes-to-access-tokens, https://laravel.com/docs/11.x/passport#refreshing-tokens
   * @requestBody [{"grant_type": "authorization_code", "client_id": "string", "redirect_uri": "string", "code_verifier": "string", "code": "string"}, {"grant_type": "refresh_token", "client_id": "string", "refresh_token": "string", "scope": "string"}]
   * @responseBody 200 - {"access_token": "string", "token_type": "string", "expires_in": 3600, "refresh_token": "string", "scope": "string"}
   */
  public async token({ request, response }: HttpContext) {
    const normalizeHeaders = (headers: Record<string, any>): Record<string, string> => {
      return Object.entries(headers).reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value[0] : (value ?? '')
        return acc
      }, {} as Record<string, string>)
    }

    const oauthRequest = new Request({
      headers: normalizeHeaders(request.headers()),
      body: request.body(),
      method: request.method(),
      query: request.qs(),
    })
    const oauthResponse = new Response({
      body: response.getBody(),
      headers: response.getHeaders(),
      status: response.response.statusCode,
    })

    let options = {
      requireClientAuthentication: { refresh_token: false },
    }

    try {
      await oauth.token(oauthRequest, oauthResponse, options)

      return response.send(oauthResponse.body)
    } catch (err) {
      sentry.captureException(err)

      return response.status(err.status || 500).send(err.message)
    }
  }
}
