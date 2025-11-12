import { generateRandomString } from '#helpers/url_helper'
import ReferralProgram from '#models/referral_program'
import User from '#models/user'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class CreateCommunityProgram extends BaseCommand {
  static commandName = 'create:community-program'
  static description = 'Create a community program'

  @flags.string({
    description: 'The name of the program',
  })
  declare name: string

  @flags.string({
    description: 'The description of the program',
  })
  declare description: string

  @flags.number({
    description: 'The app rate of the program',
    default: 0.3,
  })
  declare appRate: number

  @flags.number({
    description: 'The user rate of the program',
    default: 0.7,
  })
  declare userRate: number

  @flags.number({
    description: 'The referral rate of the program',
    default: 0.0,
  })
  declare referralRate: number

  @flags.string({
    description: 'The config of the program',
    default: '{}',
  })
  declare config: string

  static options: CommandOptions = {
    startApp: true,
    staysAlive: false,
  }

  async run() {
    if (!this.name) {
      this.name = await this.prompt.ask('Enter the program name')
    }

    if (!this.description) {
      this.description = await this.prompt.ask('Enter the program description')
    }

    if (this.appRate === undefined) {
      this.appRate = await this.prompt.ask('Enter the program app rate')
    }

    if (this.userRate === undefined) {
      this.userRate = await this.prompt.ask('Enter the program user rate')
    }

    if (this.referralRate === undefined) {
      this.referralRate = await this.prompt.ask('Enter the program referral rate')
    }

    if (!this.config) {
      this.config = await this.prompt.ask('Enter the program config')
    }

    const program = await ReferralProgram.firstOrCreate(
      { name: this.name },
      {
        name: this.name,
        description: this.description,
        appRate: this.appRate,
        userRate: this.userRate,
        referralRate: this.referralRate,
        config: this.config ? JSON.parse(this.config) : {},
        isCommunity: true,
      }
    )

    const email = `community@${this.name.toLowerCase()}.com`
    const user = await User.firstOrCreate(
      { email },
      {
        name: `${this.name} Community`,
        email,
        referralCode: `${this.name.toUpperCase()}${generateRandomString()}`,
        source: this.name.toLowerCase(),
      }
    )
    await user.related('userReferral').create({
      referralProgramId: program.id,
    })

    this.logger.success(`Community program created successfully: ${program.name}`)
    this.logger.success(`Community user created successfully`)
    console.log(user.toJSON())
  }
}
