import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected sellersTableName = 'sellers'
  protected productsTableName = 'products'

  async up() {
    this.schema.alterTable(this.sellersTableName, (table) => {
      table.integer('active_product_count').defaultTo(0).notNullable().after('is_active')
    })

    this.schema.alterTable(this.productsTableName, (table) => {
      // The 'active' column indicates if a product currently has seller commission.
      // It is set to true if the product is returned by the Shopee API with isAMSOffer: true.
      // If a product is no longer returned by the API under these conditions, 'active' is set to false.
      // This could be due to various reasons: out of stock, delisted by seller,
      // product deleted, no longer part of the seller commission program, etc.
      table.boolean('active').defaultTo(false).notNullable().after('clicks')
    })
  }

  async down() {
    this.schema.alterTable(this.sellersTableName, (table) => {
      table.dropColumn('active_product_count')
    })

    this.schema.alterTable(this.productsTableName, (table) => {
      table.dropColumn('active')
    })
  }
}