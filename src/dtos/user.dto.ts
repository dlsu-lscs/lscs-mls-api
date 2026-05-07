export interface User {
    uid: number,
    idNumber?: string,
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