// Update with your config settings.
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5433,
      database: process.env.DB_NAME || 'onlyfans_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations-knex',
    },
  },
};