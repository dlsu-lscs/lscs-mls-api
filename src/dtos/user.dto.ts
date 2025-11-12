export interface User {
    id: number,
    idNumber?: number,
    email?: string,
    givenName?: string,
    familyName?: string,
    userId: string
    pictureUrl?: string
}

export interface CreateUser {
    idNumber?: number,
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