import RawConversion from '#models/raw_conversion'
import { webhookConversionValidator, webhookConversionValidatorOld } from '#validators/webhook'
import type { HttpContext } from '@adonisjs/core/http'

export default class WebhookController {
  /**
   * Safely decode URI component with fallback for malformed strings
   */
  private safeDecodeURIComponent(value: string): string {
    try {
      return decodeURIComponent(value)
    } catch (error) {
      // Manual replacement of common URL encodings for malformed strings
      return this.manualDecodeURIComponent(value)
    }
  }

  /**
   * Manual replacement of common URL encodings
   */
  private manualDecodeURIComponent(value: string): string {
    const encodingMap: Record<string, string> = {
      '%20': ' ', // space
      '%21': '!', // exclamation mark
      '%22': '"', // quotation mark
      '%23': '#', // hash
      '%24': '$', // dollar
      '%25': '%', // percent
      '%26': '&', // ampersand
      '%27': "'", // apostrophe
      '%28': '(', // left parenthesis
      '%29': ')', // right parenthesis
      '%2B': '+', // plus
      '%2C': ',', // comma
      '%2D': '-', // hyphen
      '%2E': '.', // period
      '%2F': '/', // slash
      '%3A': ':', // colon
      '%3B': ';', // semicolon
      '%3C': '<', // less than
      '%3D': '=', // equals
      '%3E': '>', // greater than
      '%3F': '?', // question mark
      '%40': '@', // at symbol
      '%5B': '[', // left bracket
      '%5C': '\\', // backslash
      '%5D': ']', // right bracket
      '%7B': '{', // left brace
      '%7C': '|', // pipe
      '%7D': '}', // right brace
      '%7E': '~', // tilde
    }

    let decoded = value

    // Replace known encodings (case insensitive)
    for (const [encoded, char] of Object.entries(encodingMap)) {
      decoded = decoded.replace(new RegExp(encoded, 'gi'), char)
    }

    return decoded
  }

  public async conversion({ request, response }: HttpContext) {
    const nonValidatedPayload: { [key: string]: any } = {}

    Object.entries(request.qs()).forEach(([key, value]) => {
      nonValidatedPayload[key] = this.safeDecodeURIComponent(value)
    })

    const payload = await webhookConversionValidator.validate(nonValidatedPayload)

    await RawConversion.create({
      conversionId: payload.conversion_id,
      rawData: payload,
    })

    return response.created()
  }

  public async conversionOld({ request, response }: HttpContext) {
    const nonValidatedPayload: { [key: string]: any } = {}

    Object.entries(request.qs()).forEach(([key, value]) => {
      nonValidatedPayload[key] = this.safeDecodeURIComponent(value)
    })

    const payload = await webhookConversionValidatorOld.validate(nonValidatedPayload)

    const rawConversion = await RawConversion.create({
      conversionId: payload.conversion_id,
      rawData: payload,
    })

    await RawConversion.dispatchConversionProcessJob(rawConversion)

    return response.created({
      message: 'Conversion process created',
    })
  }
}
