import Reward from '#models/reward'
import User from '#models/user'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class AddRewards extends BaseCommand {
  static commandName = 'add:rewards'
  static description = 'Add rewards to users based on their emails'

  static examples = [
    'node ace add:rewards --emails="user1@example.com,user2@example.com" --module="referral" --amount=50',
    'node ace add:rewards --emails="user@example.com" --module="bonus" --amount=100 --currency="RM" --remarks="Welcome bonus"',
    'node ace add:rewards --dry-run --emails="user@example.com" --module="test" --amount=25',
  ]

  @flags.string({
    description: 'The emails of users to add rewards to (use comma to separate multiple emails)',
  })
  declare emails: string

  @flags.string({
    description: 'The module name for the reward',
  })
  declare module: string

  @flags.number({
    description: 'The reward amount (must be greater than 0)',
  })
  declare amount: number

  @flags.string({
    description: 'The currency for the reward (defaults to RM)',
    default: 'RM',
  })
  declare currency: string

  @flags.string({
    description: 'The withdrawal id for the reward',
  })
  declare metadata: string

  @flags.string({
    description: 'Optional remarks for the reward',
  })
  declare remarks: string

  @flags.boolean({
    description: 'Show a summary of what will be added before proceeding',
    default: false,
  })
  declare dryRun: boolean

  @flags.boolean({
    description: 'Skip confirmation prompt and proceed directly',
    default: false,
  })
  declare force: boolean

  static options: CommandOptions = {
    startApp: true,
    staysAlive: false,
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  async run() {
    // Prompt for emails if not provided
    if (!this.emails) {
      this.emails = await this.prompt.ask(
        'Enter the user emails (use comma to separate multiple emails)',
        {
          validate(value) {
            if (!value || value.trim().length === 0) {
              return 'Emails cannot be empty'
            }
            return true
          },
        }
      )
    }

    // Prompt for module if not provided
    if (!this.module) {
      this.module = await this.prompt.ask('Enter the module name for the reward', {
        validate(value) {
          if (!value || value.trim().length === 0) {
            return 'Module name cannot be empty'
          }
          if (value.trim().length > 100) {
            return 'Module name is too long (max 100 characters)'
          }
          return true
        },
      })
    }
    // Trim module name
    this.module = this.module.trim()

    // Prompt for amount if not provided
    if (!this.amount) {
      const amountInput = await this.prompt.ask('Enter the reward amount', {
        validate(value) {
          const num = parseFloat(value)
          if (isNaN(num)) {
            return 'Please enter a valid number'
          }
          if (num <= 0) {
            return 'Amount must be greater than 0'
          }
          return true
        },
      })
      this.amount = parseFloat(amountInput)
    }

    // Parse emails
    const emailList = this.emails.split(',').map((email) => email.trim())

    // Validate email format
    const invalidEmails = emailList.filter((email) => !this.isValidEmail(email))
    if (invalidEmails.length > 0) {
      this.logger.error(`Invalid email format: ${invalidEmails.join(', ')}`)
      return
    }

    // Find users by emails
    const users = await User.query().whereIn('email', emailList)

    if (users.length === 0) {
      this.logger.error('No users found with the provided emails')
      return
    }

    // Check if all emails were found
    const foundEmails = users.map((user) => user.email)
    const notFoundEmails = emailList.filter((email) => !foundEmails.includes(email))

    if (notFoundEmails.length > 0) {
      this.logger.warning(`The following emails were not found: ${notFoundEmails.join(', ')}`)
    }

    // Show summary
    this.logger.info(`Found ${users.length} users:`)
    for (const user of users) {
      this.logger.info(`  - ${user.email} (ID: ${user.id})`)
    }

    this.logger.info(`\nReward details:`)
    this.logger.info(`  Module: ${this.module}`)
    this.logger.info(`  Amount: ${this.amount} ${this.currency}`)
    this.logger.info(`  Remarks: ${this.remarks || 'None'}`)
    this.logger.info(`  Metadata: ${this.metadata || 'None'}`)

    // If dry run, just show what would be done
    if (this.dryRun) {
      this.logger.info('\nThis is a dry run. No rewards will be created.')
      this.logger.info(`Would create ${users.length} reward(s)`)
      return
    }

    // Confirm before proceeding (unless force flag is used)
    if (!this.force) {
      const confirm = await this.prompt.confirm(
        `Are you sure you want to create ${users.length} reward(s)?`
      )

      if (!confirm) {
        this.logger.info('Operation cancelled')
        return
      }
    }

    // Create rewards
    const createdRewards = []
    let successCount = 0
    let errorCount = 0

    // Create rewards
    for (const user of users) {
      try {
        const reward = await Reward.create({
          userId: user.id,
          module: this.module,
          currency: this.currency,
          amount: this.amount,
          metadata: this.metadata ? JSON.parse(this.metadata) : {},
          remarks: this.remarks || null,
          withdrawalId: null,
          statusId: 4, // Default to 'paid' status
        })

        createdRewards.push(reward)
        successCount++

        this.logger.success(
          `Created reward for ${user.email} (ID: ${user.id}) - Amount: ${this.amount} ${this.currency}`
        )
      } catch (error) {
        errorCount++
        this.logger.error(
          `Failed to create reward for ${user.email} (ID: ${user.id}): ${error.message}`
        )
      }
    }

    // Summary
    this.logger.info('=== Summary ===')
    this.logger.success(`Successfully created: ${successCount} reward(s)`)
    if (errorCount > 0) {
      this.logger.error(`Failed to create: ${errorCount} reward(s)`)
    }
    this.logger.info(`Total rewards created: ${createdRewards.length}`)
  }
}
