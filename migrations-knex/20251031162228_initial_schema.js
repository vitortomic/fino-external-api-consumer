/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('username').notNullable().unique();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('onlyfans_account_id').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .then(() => {
      // Create indexes
      return knex.schema.raw('CREATE INDEX idx_users_username ON users(username)');
    })
    .then(() => {
      return knex.schema.raw('CREATE INDEX idx_users_email ON users(email)');
    })
    .then(() => {
      return knex.schema.raw('CREATE INDEX idx_users_onlyfans_account_id ON users(onlyfans_account_id)');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
