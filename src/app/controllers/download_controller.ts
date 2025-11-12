// filepath: src/app/controllers/download_controller.ts
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import { UAParser } from 'ua-parser-js'

export default class DownloadController {
  public async handle({ request, response }: HttpContext) {
    const ua = request.header('user-agent') || ''
    const parser = new UAParser(ua)
    const os = (parser.getOS().name || '').toLowerCase()

    let location = ''
    // let osAgent = ''

    if (os.includes('ios') || os.includes('macos')) {
      // osAgent = 'iOS'
      location = env.get('APP_STORE_URL', 'https://apps.apple.com/my/app/cha-ching-shop-get-cashback/id6745090543')
    } else if (os.includes('android')) {
      // osAgent = 'Android'
      location = env.get('PLAY_STORE_URL', 'https://play.google.com/store/apps/details?id=com.cmv.chaching')
    } else {
      // osAgent = 'web'
      location = `${env.get('APP_URL', 'https://cashiu.app')}/download-app`
    }

    // TODO: Extract query parameters such as source, variant, experiment_id, etc.
    // const source = request.input('source', '')
    // const variant = request.input('variant', '')
    // const experiment_id = request.input('experiment_id', '')
    // const d = request.input('d', '')
    // const type = request.input('type', '')
    // const device_category = request.input('device_category', '')
    // const type_source = request.input('type_source', '')

    // TODO: Override location based on A/B test or type_source if applicable
    // if (type_source === 'iOS') {
    //   location = env.get('APP_STORE_URL', 'https://apps.apple.com/my/app/cha-ching-shop-get-cashback/id6745090543')
    // } else if (type_source === 'Android') {
    //   location = env.get('PLAY_STORE_URL', 'https://play.google.com/store/apps/details?id=com.cmv.chaching')
    // }

    // TODO: Implement analytics tracking for download events
    // e.g., send data to Firehose, GA4, or other analytics platforms

    return response.redirect(location)
  }
}
