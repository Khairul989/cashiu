import User from '#models/user'
import env from '#start/env'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const OAuthController = () => import('#controllers/oauth_controller')
const SocialLoginController = () => import('#controllers/social_login_controller')

router
  .group(() => {
    router
      .get('login', async ({ inertia, session, response, auth }) => {
        if (await auth.use('web').check()) {
          const intendedUrl = session.pull('intended')

          return intendedUrl
            ? response.redirect(intendedUrl)
            : response.redirect().toRoute('admin.sellers.index')
        }

        return inertia.render('login', {
          useEmailPassword: env.get('ENABLE_EMAIL_PASSWORD', false),
          googleLogin: env.get('GOOGLE_CLIENT_ID', '').length > 0,
          appleLogin: env.get('APPLE_CLIENT_ID', '').length > 0,
        })
      })
      .as('login')

    if (env.get('ENABLE_EMAIL_PASSWORD', false)) {
      router
        .post('login', async ({ request, response, auth, session }) => {
          await User.updateOrCreate(
            { email: request.input('email') },
            {
              name: request.input('email').split('@')[0],
              password: request.input('password'),
            }
          )

          const user = await User.verifyCredentials(
            request.input('email'),
            request.input('password')
          )

          await auth.use('web').login(user)

          const intendedUrl = session.pull('intended')

          return intendedUrl
            ? response.redirect(intendedUrl)
            : response.redirect().toRoute('auth.login')
        })
        .as('login.store')
    }

    router
      .group(() => {
        router.get('authorize', [OAuthController, 'authorize']).as('authorize')

        router
          .post('logout', async ({ auth, session, response }) => {
            await auth.use('web').logout()

            session.regenerate()

            return response.redirect().toRoute('auth.login')
          })
          .as('logout')
      })
      .middleware(middleware.auth({ guards: ['web'] }))

    router.post('token', [OAuthController, 'token']).as('token')

    router
      .group(() => {
        router
          .get(':provider', [SocialLoginController, 'redirect'])
          .where('provider', 'google|apple')
          .as('redirect')

        router
          .any(':provider/callback', [SocialLoginController, 'callback'])
          .where('provider', 'google|apple')
          .as('redirect.callback')
      })
      .prefix('social')
      .as('social')
  })
  .prefix('auth')
  .as('auth')
