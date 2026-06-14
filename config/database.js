const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required. Copy your Supabase Postgres connection string into .env.");
}

const useSsl = String(process.env.DATABASE_SSL || "true").toLowerCase() !== "false";

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 5
});

module.exports = {
  pool
};
