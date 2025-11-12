import SocialAccount from '#models/social_account'
import User from '#models/user'
import { AppleLoginService } from '#services/authentication/apple_login_service'
import { AuthenticationInterface } from '#services/authentication/authentication_interface'
import { GoogleLoginService } from '#services/authentication/google_login_service'
import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import sentry from '@benhepburn/adonis-sentry/service'
import { Acl } from '@holoyan/adonisjs-permissions'
import { randomBytes } from 'node:crypto'

export default class SocialLoginController {
  public async redirect({ params, session, response }: HttpContext) {
    const provider: 'google' | 'apple' = params.provider
    let providerService: AuthenticationInterface | undefined

    if (provider === 'google') providerService = new GoogleLoginService()
    if (provider === 'apple') providerService = new AppleLoginService()

    if (!providerService) throw new Error('Invalid provider')

    const state = randomBytes(16).toString('hex')
    const nonce = randomBytes(16).toString('hex')

    session.put('state', state)
    session.put('nonce', nonce)

    return response.redirect(providerService.getRedirectUrl(state, nonce))
  }

  public async callback({ params, auth, request, response, session }: HttpContext) {
    const provider: 'google' | 'apple' = params.provider
    let providerService: AuthenticationInterface | undefined

    if (provider === 'google') providerService = new GoogleLoginService()
    if (provider === 'apple') providerService = new AppleLoginService()

    if (!providerService) throw new Error('Invalid provider')

    if (request.input('state') !== session.pull('state')) {
      throw new Error('Invalid state')
    }

    if (request.input('user')) {
      const userFromResponse = JSON.parse(request.input('user')) as {
        name: { firstName: string; lastName: string | null }
        email: string
      }

      if (providerService instanceof AppleLoginService) {
        providerService.setFirstAndLastName(
          `${userFromResponse.name.firstName} ${userFromResponse.name.lastName}`.trim()
        )
      }
    }

    const providerUser = await providerService.getUserInfo(
      request.input('code'),
      session.pull('nonce')
    )

    const intendedUrl = session.pull('intended')
    if (typeof intendedUrl === 'string') {
      try {
        const url = new URL(intendedUrl)
        const sourceParam = url.searchParams.get('source')
        if (sourceParam) {
          session.put('source', sourceParam)
        }
      } catch {}
    }

    const trx = await db.transaction()
    try {
      const userAccountDetails: {
        email: string
        isAdmin: boolean
        name?: string
        avatar?: string
        source?: string
      } = {
        email: providerUser.email,
        isAdmin: ['@involve.asia', '@cmv.one', '@valmedia.co'].some((domain) =>
          providerUser.email.includes(domain)
        ),
      }

      const sourceFromIntended = session.pull('source')
      if (sourceFromIntended) {
        userAccountDetails['source'] = sourceFromIntended.toLowerCase()
      }

      if (providerUser.name) {
        userAccountDetails['name'] = providerUser.name
      }

      if (providerUser.avatarUrl) {
        userAccountDetails['avatar'] = providerUser.avatarUrl
      }

      const socialAccount = await SocialAccount.query()
        .where('providerId', providerUser.id)
        .where('providerName', params.provider)
        .first()

      let user: User

      if (socialAccount) {
        await socialAccount.load('user')

        user = socialAccount.user as User

        user.merge(userAccountDetails)
        user.useTransaction(trx)

        await user.save()
      } else {
        user = await User.updateOrCreate(
          { email: userAccountDetails.email },
          { ...userAccountDetails },
          { client: trx }
        )

        await user
          .related('socialAccounts')
          .create({ providerId: providerUser.id, providerName: params.provider }, { client: trx })
      }

      await trx.commit()

      await auth.use('web').login(user)

      // Assign default permissions to the admin user
      await Acl.model(user).assignRole('default')

      return intendedUrl
        ? response.redirect(intendedUrl)
        : response.redirect().toRoute('auth.login')
    } catch (error) {
      await trx.rollback()

      sentry.captureException(error)

      return response.status(500).send(error.message)
    }
  }
}
