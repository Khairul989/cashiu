import ProcessRawConversionJob, {
  ProcessRawConversionJobPayload,
} from '#jobs/process_raw_conversion_job'
import { InvolveAsiaConversionData } from '#types/conversion'
import bull from '@acidiney/bull-queue/services/main'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class RawConversion extends BaseModel {
  static async dispatchConversionProcessJob(rawConversion: RawConversion) {
    await bull.dispatch(
      ProcessRawConversionJob.name,
      {
        rawConversionId: rawConversion.id,
        conversionData: rawConversion.rawData,
      } as ProcessRawConversionJobPayload,
      { queueName: 'process_raw_conversion' }
    )
  }

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare conversionId: number

  @column({
    prepare: (value: object) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare rawData: InvolveAsiaConversionData | object

  @column()
  declare remarks: string | null

  @column.dateTime()
  declare processedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
