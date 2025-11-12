import { UserFactory } from '#database/factories/user_factory'
import Client from '#models/client'
import User from '#models/user'
import env from '#start/env'
import { test } from '@japa/runner'
import crypto, { randomBytes } from 'node:crypto'

test.group('authentication', (group) => {
  group.setup(async () => {
    await UserFactory.create()

    await Client.create({
      name: 'Test Client',
      redirect: [`http://${env.get('HOST')}:${env.get('PORT')}/auth/callback`],
    })
  })

  test('get access_token and ensure refresh_token works').run(async ({ client, expect }) => {
    const user = await User.firstOrFail()
    const authClient = await Client.firstOrFail()

    const codeVerifier = randomBytes(16).toString('hex')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const pkceParams = new URLSearchParams()
    pkceParams.append('client_id', authClient.id)
    pkceParams.append('redirect_uri', authClient.redirect[0])
    pkceParams.append('response_type', 'code')
    pkceParams.append('scope', '*')
    pkceParams.append('state', randomBytes(16).toString('hex'))
    pkceParams.append('code_challenge', codeChallenge)
    pkceParams.append('code_challenge_method', 'S256')

    const authResponse = await client
      .get(`/auth/authorize?${pkceParams.toString()}`)
      .trustLocalhost()
      .loginAs(user)
      .send()

    const authRedirectUrl = new URL(authResponse.redirects()[0])

    const code = authRedirectUrl.searchParams.get('code')
    const state = authRedirectUrl.searchParams.get('state')

    expect(code).toBeDefined()
    expect(state).toBeDefined()
    expect(state).toEqual(pkceParams.get('state'))

    const tokenResponse = await client
      .post(`/auth/token`)
      .trustLocalhost()
      .form({
        grant_type: 'authorization_code',
        client_id: authClient.id,
        redirect_uri: authClient.redirect[0],
        code_verifier: codeVerifier,
        code: code,
      })
      .send()

    expect(Object.keys(tokenResponse.body())).toEqual([
      'access_token',
      'token_type',
      'expires_in',
      'refresh_token',
      'scope',
    ])

    const refreshTokenResponse = await client
      .post(`/auth/token`)
      .trustLocalhost()
      .form({
        grant_type: 'refresh_token',
        client_id: authClient.id,
        refresh_token: tokenResponse.body().refresh_token,
      })
      .send()

    expect(Object.keys(refreshTokenResponse.body())).toEqual([
      'access_token',
      'token_type',
      'expires_in',
      'refresh_token',
      'scope',
    ])
  })
})
