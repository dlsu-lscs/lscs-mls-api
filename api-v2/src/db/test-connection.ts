import { sql } from "drizzle-orm";
import { db, pool } from "./index.js";

async function main() {
  try {
    const result = await db.execute(
      sql`SELECT current_database() AS database, current_user AS user`
    );

    console.log("Database connection successful!");
    console.log(result.rows);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

