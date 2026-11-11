import type { userPreferences } from "../db/schema/user_preferences.schema.js";

export type UserPreferenceRow = typeof userPreferences.$inferSelect;

export interface UserPreferences {
  id: number;
  preferredTimes: string[];
  preferredF2f: string[];
  preferredFree: string[];
  targetUnits?: number;
  programCode?: string;
  college?: string;
  maxVacant?: number;
  preferredCampus?: string;
}

export interface CreateUserPreferences {
  id: number;
  preferredTimes?: string[];
  preferredF2f?: string[];
  preferredFree?: string[];
  targetUnits?: number;
  programCode?: string;
  college?: string;
  maxVacant?: number;
  preferredCampus?: string;
}

export interface UpdateUserPreferences {
  preferredTimes?: string[];
  preferredF2f?: string[];
  preferredFree?: string[];
  targetUnits?: number;
  programCode?: string;
  college?: string;
  maxVacant?: number;
  preferredCampus?: string;
}

export function mapToUserPreferencesDTO(dbRow: any): UserPreferences | null {
  if (!dbRow) {
    return null;
  }

  return {
    id: dbRow.uid,
    preferredTimes: dbRow.preferredTimes ?? dbRow.preferred_times ?? [],
    preferredF2f: dbRow.preferredF2f ?? dbRow.preferred_f2f ?? [],
    preferredFree: dbRow.preferredFree ?? dbRow.preferred_free ?? [],
    targetUnits: dbRow.targetUnits ?? dbRow.target_units ?? undefined,
    programCode: dbRow.programCode ?? dbRow.program_code ?? undefined,
    college: dbRow.college ?? undefined,
    maxVacant: dbRow.maxVacant ?? dbRow.max_vacant ?? undefined,
    preferredCampus: dbRow.preferredCampus ?? dbRow.preferred_campus ?? undefined,
  };
}