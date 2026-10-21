import type { users } from "../db/schema/users.js";

export type UserRow = typeof users.$inferSelect;

export interface User {
    id: number,
    email?: string,
    givenName?: string,
    familyName?: string,
    userId: string
    pictureUrl?: string
}

export interface CreateUser {
    email?: string,
    givenName?: string,
    familyName?: string,
    userId: string
    pictureUrl?: string
}

export interface UpdateUser {
    givenName?: string,
    familyName?: string,
    pictureUrl?: string
}

export function mapToUserDTO(dbRow: any): User | null {
    if (!dbRow) {
        return null;
    }

    return {
        id: dbRow.uid ?? dbRow.id,
        email: dbRow.email ?? undefined,
        givenName: dbRow.givenName ?? dbRow.given_name ?? undefined,
        familyName: dbRow.familyName ?? dbRow.family_name ?? undefined,
        userId: dbRow.userId ?? dbRow.user_id,
        pictureUrl: dbRow.pictureUrl ?? dbRow.picture_url ?? undefined,
    };
}