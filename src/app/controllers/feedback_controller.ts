import Feedback from '#models/feedback'
import User from '#models/user'
import env from '#start/env'
import { feedbackValidator } from '#validators/feedback'
import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'

export default class FeedbackController {
  /**
   * @handle
   * @tag Feedback
   * @operationId feedbackStore
   * @summary Store feedback
   * @requestBody {"userAgent": "string", "feedbackText": "string", "feedbackType": "string", "email": "string|null"}
   */
  async handle({ request, response, auth }: HttpContext) {
    await auth.use('api').check()

    const user = auth.use('api').user as User | undefined
    const payload = await request.validateUsing(feedbackValidator, {
      meta: { userId: user?.id ?? null },
    })

    await Feedback.create({
      userId: user?.id ?? null,
      data: payload,
    })

    // send email
    await mail.sendLater((message) => {
      message
        .to(env.get('FEEDBACK_EMAIL_ADDRESS'))
        .subject(`${user?.name || 'Someone'} has submitted feedback`)
        .htmlView('emails/feedback_submitted', {
          content: payload.feedbackText,
          name: user?.name || null,
          email: payload.email || user?.email,
        })
    })

    return response.noContent()
  }
}
