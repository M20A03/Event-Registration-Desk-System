const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const useSsl = String(process.env.DATABASE_SSL || "true").toLowerCase() !== "false";

let pool;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: 5
  });
} else {
  console.warn("WARNING: DATABASE_URL environment variable is missing. Database queries will fail.");
  pool = {
    query: async () => {
      throw new Error("Database connection failed because DATABASE_URL environment variable is not configured in Vercel.");
    }
  };
}

module.exports = {
  pool
};
