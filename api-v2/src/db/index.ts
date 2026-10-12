
import dotenv from 'dotenv';
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DB_URL;

if (!connectionString) {
  throw new Error("DB_URL not configured");
}

export const pool = new Pool({
  connectionString,
})

export const db = drizzle(pool);




