# Documentation: user.service.test.ts

## Purpose
Validates the low-level business logic and Drizzle ORM interactions for the User module. It ensures that the database state is consistently maintained and that service methods correctly transform DB rows into the expected DTO shape.

## Key Test Cases
1. **`createUser`**: 
   - **Scenario**: Inserting a user with a `userId` that does not exist.
   - **Technicality**: Verifies Drizzle `.insert().returning()` logic. Checks that the service performs a `getUserByUserId` check before insertion to handle unique constraints.
2. **`getUserByUserId`**:
   - **Scenario**: Lookup existing record by the Google `sub` ID.
   - **Technicality**: Tests the `.where(eq(users.userId, userId))` clause.
3. **`updateUser`**:
   - **Scenario**: Partial update of user details.
   - **Technicality**: Verifies that the update service properly spreads existing fields (`givenName = existingUser.givenName`) and only updates the fields provided in the `UpdateUser` DTO.

## Troubleshooting
- **If tests fail**: Check if `users.uid` (Primary Key) conflicts with existing test data. 
- **DB Cleanup**: The suite automatically attempts to delete rows with `user_id LIKE 'svc-%'`. Ensure your DB user has `DELETE` permissions on the `users` table.
- **DTO Mismatch**: If `mapToUserDTO` results in `null`, verify that the Drizzle schema `uid` field is being correctly mapped to `id` in the DTO.
