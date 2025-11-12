import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'

export default class Client extends BaseModel {
  static table = 'oauth_clients'
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(client: Client) {
    client.id = randomUUID()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: number | null

  @column()
  declare name: string

  @column()
  declare secret: string | null

  @column()
  declare provider: string | null

  @column({
    prepare: (value: string) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare redirect: string[]

  @column()
  declare personalAccessClient: boolean

  @column()
  declare passwordClient: boolean

  @column()
  declare revoked: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
