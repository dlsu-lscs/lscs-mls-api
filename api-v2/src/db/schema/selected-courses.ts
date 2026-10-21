import { pgTable, integer } from "drizzle-orm/pg-core";
import { courses } from "./courses.js";
import { users } from "./users.js";

export const selectedCourses = pgTable("selected_courses", {
  sid: integer("sid")
    .primaryKey()
    .generatedByDefaultAsIdentity(),

  courseId: integer("course_id")
    .notNull()
    .references(() => courses.cid, {
      onDelete: "cascade",
    }),

  userId: integer("user_id")
    .notNull()
    .references(() => users.uid, {
      onDelete: "cascade",
    }),
});
