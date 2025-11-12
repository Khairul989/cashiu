import User from '#models/user'
import { ExceptionHandler, HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import { errors as lucidErrors } from '@adonisjs/lucid'
import sentry from '@benhepburn/adonis-sentry/service'
import { errors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '400..599': (error, { view }) => {
      console.log('[HttpExceptionHandler statusPages] Executing')
      const status = error.status || 500 // Default to 500 if no status is set
      console.log(`[HttpExceptionHandler statusPages] Determined status: ${status}`)

      if (app.inProduction) {
        console.log('[HttpExceptionHandler statusPages] In production - rendering generic error page')
        // In production, always show a generic message for errors in this range (400-599)
        return view.render('pages/errors/error_page', {
          error: {
            status: status,
            message: 'An unexpected error occurred. Please try again later.',
            // No stack or other sensitive details
          },
        })
      }
      // If not in production, show the original error details
      console.log('[HttpExceptionHandler statusPages] Not in production - rendering detailed error page')
      return view.render('pages/errors/error_page', { error })
    },
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: any, ctx: HttpContext) {
    console.log('[HttpExceptionHandler handle] Executing')
    const isJsonRequest = ctx.request.header('accept')?.includes('json')
    const isValidationError = error instanceof errors.E_VALIDATION_ERROR
    console.log(`[HttpExceptionHandler handle] Is JSON request: ${isJsonRequest}, Is Validation Error: ${isValidationError}`)

    if (isJsonRequest && !isValidationError) {
      console.log('[HttpExceptionHandler handle] Handling as JSON response for non-validation error')
      let errorMessage = 'Something went wrong'
      let errorCode = 500

      if (error.message) {
        errorMessage = error.message
        console.log(`[HttpExceptionHandler handle] JSON error message set from error.message: ${errorMessage}`)
      }

      if (error.status) {
        errorCode = error.status
        console.log(`[HttpExceptionHandler handle] JSON error code set from error.status: ${errorCode}`)
      }

      if (error instanceof lucidErrors.E_ROW_NOT_FOUND) {
        errorMessage = `${error.model?.name || 'Row'} not found`
        console.log(`[HttpExceptionHandler handle] JSON error message set for E_ROW_NOT_FOUND: ${errorMessage}`)
      }

      console.log(`[HttpExceptionHandler handle] Sending JSON error response with status ${errorCode}`)
      return ctx.response.status(errorCode).send({ message: errorMessage })
    }

    console.log('[HttpExceptionHandler handle] Passing to super.handle')
    return super.handle(error, ctx)
  }

  protected context(ctx: HttpContext) {
    console.log('[HttpExceptionHandler context] Executing')
    return {
      requestId: ctx.request.id(),
      userId: ctx.auth?.user ? (ctx.auth.user as User).id : null,
      ip: ctx.request.ip(),
    }
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    console.log('[HttpExceptionHandler report] Executing')
    if (this.shouldReport(error as any)) {
      console.log('[HttpExceptionHandler report] Reporting error to Sentry')
      sentry.captureException(error)
    } else {
      console.log('[HttpExceptionHandler report] Error will not be reported by this handler')
    }

    console.log('[HttpExceptionHandler report] Passing to super.report')
    return super.report(error, ctx)
  }
}
