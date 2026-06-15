const { Pool } = require("pg");

let pool = null;

function isDatabaseConnectionError(error) {
  if (!error) {
    return false;
  }

  const message = String(error.message || "").toLowerCase();
  const databaseErrorCodes = new Set([
    "28P01",
    "3D000",
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "ECONNRESET"
  ]);

  return (
    databaseErrorCodes.has(error.code) ||
    message.includes("database_url") ||
    message.includes("password authentication failed") ||
    message.includes("connection terminated") ||
    message.includes("connect timeout") ||
    message.includes("no pg_hba.conf entry")
  );
}

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  const useSsl = String(process.env.DATABASE_SSL || "true").toLowerCase() !== "false";

  if (!connectionString) {
    console.warn("WARNING: DATABASE_URL environment variable is missing. Database queries will fail.");
    return {
      query: async () => {
        throw new Error("Database connection failed because DATABASE_URL environment variable is not configured.");
      }
    };
  }

  pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: 5
  });

  return pool;
}

module.exports = {
  query: (...args) => getPool().query(...args),
  isDatabaseConnectionError
};
