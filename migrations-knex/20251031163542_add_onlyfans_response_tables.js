/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('onlyfans_earnings', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable().unsigned();
      table.jsonb('earnings_data').notNullable(); // Store only the relevant data part
      table.timestamp('retrieved_at').defaultTo(knex.fn.now());
      
      // Foreign key constraint
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    })
    .createTable('onlyfans_transactions', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable().unsigned();
      table.jsonb('transactions_data').notNullable(); // Store only the relevant data part
      table.timestamp('retrieved_at').defaultTo(knex.fn.now());
      
      // Foreign key constraint
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('onlyfans_transactions')
    .dropTableIfExists('onlyfans_earnings');
};
