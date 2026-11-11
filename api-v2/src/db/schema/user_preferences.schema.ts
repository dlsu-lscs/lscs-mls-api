import { pgTable, integer, varchar, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";

export const userPreferences = pgTable("user_preferences", {
  uid: integer("uid")
    .primaryKey()
    .references(() => users.uid, { onDelete: "cascade" }),

  preferredTimes: jsonb("preferred_times").$type<string[]>().default([]),
  preferredF2f: jsonb("preferred_f2f").$type<string[]>().default([]),
  preferredFree: jsonb("preferred_free").$type<string[]>().default([]),
  targetUnits: integer("target_units"),
  programCode: varchar("program_code", { length: 50 }),
  college: varchar("college", { length: 100 }),
  maxVacant: integer("max_vacant"),
  preferredCampus: varchar("preferred_campus", { length: 80 }),
});