import {
  pgTable,
  integer,
  varchar,
} from "drizzle-orm/pg-core";

import { courses } from "./courses.schema.js";

export const courseTimeslots = pgTable("course_timeslots", {
  tid: integer("tid")
    .primaryKey()
    .generatedByDefaultAsIdentity(),

  day: varchar("day", {
    length: 5,
  }).notNull(),

  time: varchar("time", {
    length: 20,
  }).notNull(),

  room: varchar("room", {
    length: 20,
  }),

  instructor: varchar("instructor", {
    length: 120,
  }),

  courseId: integer("course_id")
    .notNull()
    .references(() => courses.cid, {
      onDelete: "cascade",
    }),
});
