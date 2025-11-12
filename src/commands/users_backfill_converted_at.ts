import Conversion from '#models/conversion'
import User from '#models/user'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'

export default class UsersBackfillConvertedAt extends BaseCommand {
  static commandName = 'users:backfill-converted-at'
  static description =
    'Fill users.converted_at with the first conversion datetime of respective users'

  static options: CommandOptions = {
    startApp: true,
    staysAlive: false,
  }

  @flags.number({ description: 'Limit number of users to process' })
  declare limit?: number

  async run() {
    const trx = await db.transaction()
    try {
      // Find user ids with at least one conversion and converted_at is null
      const query = Conversion.query({ client: trx })
        .select('user_id')
        .whereNotNull('datetime_conversion')
        .groupBy('user_id')

      if (this.limit && this.limit > 0) {
        query.limit(this.limit)
      }

      const userIdsWithConversions = (await query).map((c) => c.userId)

      this.logger.info(`Found ${userIdsWithConversions.length} users with conversions to process`)

      for (const userId of userIdsWithConversions) {
        const user = await User.query({ client: trx }).where('id', userId).first()
        if (!user) continue
        if (user.deletedAt) continue
        if (user['convertedAt' as keyof User]) continue

        const firstConversion = await Conversion.query({ client: trx })
          .where('user_id', userId)
          .whereNotNull('datetime_conversion')
          .orderBy('datetime_conversion', 'asc')
          .select('datetime_conversion')
          .first()

        if (!firstConversion) continue

        await User.query({ client: trx })
          .where('id', userId)
          .update({ convertedAt: firstConversion.datetimeConversion.toFormat('yyyy-MM-dd HH:mm:ss') })

        this.logger.success(
          `Updated user ${userId} converted_at -> ${firstConversion.datetimeConversion?.toFormat('yyyy-MM-dd HH:mm:ss')}`
        )
      }

      await trx.commit()
      this.logger.success('Backfill completed')
    } catch (error) {
      await trx.rollback()
      this.logger.error(error)
      throw error
    }
  }
}
