import { db } from "../db/index.js";
import { eq } from "drizzle-orm";

import { users } from "../db/schema/users.schema.js";
import { mapToUserDTO } from "../dtos/user.dto.js";

import type { User, CreateUser, UpdateUser } from "../dtos/user.dto.js";


export async function getUidByGoogleId(googleId: string): Promise<number | null> {
  const [user] = await db
    .select({ uid: users.uid })
    .from(users)
    .where(eq(users.userId, googleId))
    .limit(1);

  return user?.uid ?? null;
}


export async function createUser(data: CreateUser): Promise<User | null> {
  const { email, givenName, familyName, userId, pictureUrl } = data;

  const existingUser = await getUserByUserId(userId);
  if (existingUser) {
    return null;
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      givenName,
      familyName,
      userId,
      pictureUrl,
    })
    .returning();

  if (!created) {
    return null;
  }

  return mapToUserDTO(created);
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await db.select().from(users);
  return rows.map((row) => mapToUserDTO(row)!);
}

export async function getUserById(id: number): Promise<User | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.uid, id));

  return mapToUserDTO(row);
}

export async function getUserByUserId(userId: string): Promise<User | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.userId, userId));

  return mapToUserDTO(row);
}

export async function updateUser(id: number, data: UpdateUser): Promise<User | null> {
  const existingUser = await getUserById(id);
  if (!existingUser) {
    return null;
  }

  const {
    givenName = existingUser.givenName,
    familyName = existingUser.familyName,
    pictureUrl = existingUser.pictureUrl,
  } = data;

  await db
    .update(users)
    .set({
      givenName,
      familyName,
      pictureUrl,
    })
    .where(eq(users.uid, id));

  return getUserById(id);
}

export async function deleteUser(id: number): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.uid, id));
  return (result.rowCount ?? 0) > 0;
}
