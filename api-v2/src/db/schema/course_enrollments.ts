import { pgTable, integer } from "drizzle-orm/pg-core";
import { courses } from "./courses.js";

export const courseEnrollments = pgTable("course_enrollments", {
  eid: integer("eid")
    .primaryKey()
    .generatedByDefaultAsIdentity(),

  enrollCap: integer("enroll_cap"),

  enrolled: integer("enrolled"),

  courseId: integer("course_id")
    .notNull()
    .references(() => courses.cid, {
      onDelete: "cascade",
    }),
});
