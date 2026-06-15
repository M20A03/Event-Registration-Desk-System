const { Pool } = require("pg");

let pool = null;

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
  query: (...args) => getPool().query(...args)
};
