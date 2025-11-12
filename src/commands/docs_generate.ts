import swagger from '#config/swagger'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import AutoSwagger from 'adonis-autoswagger'

export default class DocsGenerate extends BaseCommand {
  static commandName = 'docs:generate'
  static description = 'Generate API documentation'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  async run() {
    const Router = await this.app.container.make('router')
    Router.commit()
    await AutoSwagger.default.writeFile(Router.toJSON(), swagger)
  }
}
