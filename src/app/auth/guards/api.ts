import { oauth } from '#auth/oauth/oauth_server'
import Client from '#models/client'
import User from '#models/user'
import env from '#start/env'
import { errors, symbols } from '@adonisjs/auth'
import { AuthClientResponse, GuardContract } from '@adonisjs/auth/types'
import { HttpContext } from '@adonisjs/core/http'
import {
  Client as OAuthClient,
  Token as OAuthToken,
  Request,
  Response,
} from '@node-oauth/oauth2-server'

/**
 * The bridge between the User provider and the
 * Guard
 */
export type ApiGuardUser<RealUser> = {
  /**
   * Returns the unique ID of the user
   */
  getId(): string | number | BigInt

  /**
   * Returns the original user object
   */
  getOriginal(): RealUser
}

/**
 * The interface for the UserProvider accepted by the
 * JWT guard.
 */
export interface ApiUserProviderContract<RealUser> {
  /**
   * A property the guard implementation can use to infer
   * the data type of the actual user (aka RealUser)
   */
  [symbols.PROVIDER_REAL_USER]: RealUser

  /**
   * Create a user object that acts as an adapter between
   * the guard and real user value.
   */
  createUserForGuard(user: RealUser): Promise<ApiGuardUser<RealUser>>

  /**
   * Find a user by their id.
   */
  findById(identifier: string | number | BigInt): Promise<ApiGuardUser<RealUser> | null>
}

export class ApiGuard<UserProvider extends ApiUserProviderContract<unknown>>
  implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
{
  #ctx: HttpContext;

  /**
   * A list of events and their types emitted by
   * the guard.
   */
  declare [symbols.GUARD_KNOWN_EVENTS]: {}

  /**
   * A unique name for the guard driver
   */
  driverName: 'api' = 'api'

  /**
   * A flag to know if the authentication was an attempt
   * during the current HTTP request
   */
  authenticationAttempted: boolean = false

  /**
   * A boolean to know if the current request has
   * been authenticated
   */
  isAuthenticated: boolean = false

  /**
   * Reference to the currently authenticated user
   */
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER]

  /**
   * The API key used for authentication.
   * This key is a string and can be undefined if not set.
   */
  apiKey: string | undefined

  /**
   * Represents a JSON Web Token (JWT) used for authentication.
   * This token is used to verify the identity of a user and grant access to protected resources.
   */
  jwtToken: string | undefined

  constructor(ctx: HttpContext) {
    this.#ctx = ctx
  }

  /**
   * Authenticate the current HTTP request and return
   * the user instance if there is a valid JWT token
   * or throw an exception
   */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    /**
     * Avoid re-authentication when it has been done already
     * for the given request
     */
    if (this.authenticationAttempted) {
      return this.getUserOrFail()
    }
    this.authenticationAttempted = true

    this.apiKey = this.#ctx.request.header('api-key')
    this.jwtToken = this.#ctx.request.header('authorization')?.split('Bearer ')[1]

    if (!this.apiKey && !this.jwtToken) {
      throw new errors.E_UNAUTHORIZED_ACCESS('unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    if (this.apiKey) {
      await this.authenticateWithApiKey()
    } else if (this.jwtToken) {
      await this.authenticateWithOAuth()
    }

    return this.getUserOrFail()
  }

  async authenticateWithOAuth(): Promise<void> {
    const normalizeHeaders = (headers: Record<string, any>): Record<string, string> => {
      return Object.entries(headers).reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value[0] : (value ?? '')
        return acc
      }, {} as Record<string, string>)
    }

    const oauthRequest = new Request({
      headers: normalizeHeaders(this.#ctx.request.headers()),
      body: this.#ctx.request.body(),
      method: this.#ctx.request.method(),
      query: this.#ctx.request.qs(),
    })
    const oauthResponse = new Response({
      body: this.#ctx.response.getBody(),
      headers: this.#ctx.response.getHeaders(),
      status: this.#ctx.response.response.statusCode,
    })

    const oauthToken: OAuthToken = await oauth.authenticate(oauthRequest, oauthResponse)
    const client: OAuthClient = oauthToken.client

    const dbClient = await Client.findOrFail(client.id)

    if (dbClient.name?.toLowerCase()?.includes('cashback app')) {
      this.user = await User.findOrFail(oauthToken.user.id)
      this.isAuthenticated = true
    } else {
      this.#ctx.session.put('client_id', client.id)
    }
  }

  async authenticateWithApiKey(): Promise<void> {
    if (
      env.get('NODE_ENV') === 'production' &&
      env.get('API_KEY_AUTH_ENABLED', 'true') === 'false'
    ) {
      throw new Error('API Key Guard is not enabled in production')
    }

    /**
     * Fetch the user by apiKey and save a reference to it
     */
    this.user = await User.findByOrFail('api_key', this.apiKey)
    this.isAuthenticated = true
  }

  /**
   * Same as authenticate, but does not throw an exception
   */
  async check(): Promise<boolean> {
    try {
      await this.authenticate()
      return true
    } catch {
      return false
    }
  }

  /**
   * Returns the authenticated user or throws an error
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('unauthenticated', {
        guardDriverName: this.driverName,
      })
    }

    return this.user
  }

  /**
   * This method is called by Japa during testing when "loginAs"
   * method is used to login the user.
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
    return {
      headers: {
        'api-key': (user as User).apiKey,
      },
    }
  }
}
