import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_categories'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.integer('category_id').notNullable().unique();
      table.string('category_name').notNullable();
      table.string('path').notNullable().defaultTo('[]'); // Compact JSON representation of the hierarchy with a default value
      table.specificType('category_level', 'INT GENERATED ALWAYS AS (JSON_LENGTH(path)) STORED'); // Virtual column to store the category level based on the path length
      table.json('image_urls').nullable();
      table.timestamps(true, true);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}