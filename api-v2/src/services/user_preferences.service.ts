import { db } from "../db/index.js";
import { eq } from "drizzle-orm";

import { userPreferences } from "../db/schema/user_preferences.schema.js";
import { users } from "../db/schema/users.schema.js";
import { mapToUserPreferencesDTO } from "../dtos/user_preferences.dto.js";

import type { UserPreferences, CreateUserPreferences, UpdateUserPreferences } from "../dtos/user_preferences.dto.js";

export async function getUserPreferencesById(userId: number): Promise<UserPreferences | null> {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.uid, userId))
    .limit(1);

  return mapToUserPreferencesDTO(row);
}

export async function createUserPreferences(data: CreateUserPreferences): Promise<UserPreferences | null> {
  // Check if user exists
  const [user] = await db
    .select({ uid: users.uid })
    .from(users)
    .where(eq(users.uid, data.id))
    .limit(1);

  if (!user) {
    return null;
  }

  // Check if preferences already exist
  const existing = await getUserPreferencesById(data.id);
  if (existing) {
    return null;
  }

  const [created] = await db
    .insert(userPreferences)
    .values({
      uid: data.id,
      preferredTimes: data.preferredTimes ?? [],
      preferredF2f: data.preferredF2f ?? [],
      preferredFree: data.preferredFree ?? [],
      targetUnits: data.targetUnits,
      programCode: data.programCode,
      college: data.college,
      maxVacant: data.maxVacant,
      preferredCampus: data.preferredCampus,
    })
    .returning();

  if (!created) {
    return null;
  }

  return mapToUserPreferencesDTO(created);
}

export async function updateUserPreferences(
  userId: number,
  data: UpdateUserPreferences
): Promise<UserPreferences | null> {
  const existingPreferences = await getUserPreferencesById(userId);
  if (!existingPreferences) {
    return null;
  }

  const {
    preferredTimes = existingPreferences.preferredTimes,
    preferredF2f = existingPreferences.preferredF2f,
    preferredFree = existingPreferences.preferredFree,
    targetUnits = existingPreferences.targetUnits,
    programCode = existingPreferences.programCode,
    college = existingPreferences.college,
    maxVacant = existingPreferences.maxVacant,
    preferredCampus = existingPreferences.preferredCampus,
  } = data;

  await db
    .update(userPreferences)
    .set({
      preferredTimes,
      preferredF2f,
      preferredFree,
      targetUnits,
      programCode,
      college,
      maxVacant,
      preferredCampus,
    })
    .where(eq(userPreferences.uid, userId));

  return getUserPreferencesById(userId);
}

export async function deleteUserPreferences(userId: number): Promise<boolean> {
  const result = await db.delete(userPreferences).where(eq(userPreferences.uid, userId));
  return (result.rowCount ?? 0) > 0;
}