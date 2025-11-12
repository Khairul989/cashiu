import User from '#models/user'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class AttachRolePermissionToUser extends BaseCommand {
  static commandName = 'attach:role-permission-to-user'
  static description = ''

  @flags.string({
    description:
      'The email of the user to attach the role to (use comma to separate multiple emails)',
  })
  declare email: string

  @flags.array({
    description: 'The roles to attach to the user',
  })
  declare roles: string[]

  @flags.boolean({
    description: 'sync roles instead of attaching',
    default: false,
  })
  declare sync: boolean

  static options: CommandOptions = {
    startApp: true,
    staysAlive: false,
  }

  async run() {
    if (!this.email) {
      this.email = await this.prompt.ask(
        'Enter the user email (use comma to separate multiple emails)',
        {
          validate(value) {
            return value.length > 0
          },
        }
      )
    }

    const emails = this.email.split(',').map((email) => email.trim())

    const users = await User.query().whereIn('email', emails)

    if (users.length === 0) {
      this.logger.error('No users found')

      return
    }

    if (!this.roles) {
      this.roles = await this.prompt.multiple('Select role(s)', [
        {
          name: 'superadmin',
          message: 'Superadmin',
        },
        {
          name: 'default',
          message: 'Default admin',
        },
        {
          name: 'finance',
          message: 'Finance',
        },
      ])
    }

    for (const user of users) {
      if (this.sync) {
        this.logger.log(`Syncing roles for user ${user.email}`)

        await user.syncRoles(this.roles)

        this.logger.success(`Roles synced for user ${user.email}`)
      } else {
        for (const role of this.roles) {
          this.logger.log(`Attaching role ${role} to user ${user.email}`)

          await user.assignRole(role)

          this.logger.success(`Role ${role} attached to user ${user.email}`)
        }
      }
    }

    this.logger.success(`Roles ${this.sync ? 'synced' : 'attached'} to users`)
  }
}
