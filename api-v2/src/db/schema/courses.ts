import {
  pgTable,
  integer,
  varchar,
} from "drizzle-orm/pg-core";

export const courses = pgTable("courses", {
  cid: integer("cid")
    .primaryKey()
    .generatedByDefaultAsIdentity(),

  courseName: varchar("course_name", {
    length: 120,
  }).notNull(),

  section: varchar("section", {
    length: 30,
  }).notNull(),

  modality: varchar("modality", {
    length: 80,
  }).default(""),

  term: varchar("term", {
    length: 80,
  }).default(""),

  campus: varchar("campus", {
    length: 80,
  }).default(""),
});

