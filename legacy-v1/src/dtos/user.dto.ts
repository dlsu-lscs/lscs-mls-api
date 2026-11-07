export interface DatabaseRow { uid: number; email?: string; given_name?: string; family_name?: string; user_id: string; picture_url?: string }

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

export function mapToUserDTO(dbRow: DatabaseRow | null | undefined): User | null {
    if (!dbRow) {
        return null;
    }

    return {
        id: dbRow.uid,
        email: dbRow.email,
        givenName: dbRow.given_name,
        familyName: dbRow.family_name,
        userId: dbRow.user_id,
        pictureUrl: dbRow.picture_url
    };
}