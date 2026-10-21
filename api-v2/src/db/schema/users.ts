import { pgTable, integer, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  uid: integer("uid")
    .primaryKey()
    .generatedByDefaultAsIdentity(),

  email: varchar("email", {
    length: 100,
  }),

  givenName: varchar("given_name", {
    length: 80,
  }),

  familyName: varchar("family_name", {
    length: 80,
  }),

  userId: varchar("user_id", {
    length: 50,
  })
    .notNull()
    .unique(),

  pictureUrl: varchar("picture_url", {
    length: 120,
  }),
});
