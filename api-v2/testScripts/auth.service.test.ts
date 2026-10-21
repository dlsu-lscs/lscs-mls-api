import { pool } from "../src/db/index.js";
import { googleAuth2 } from "../src/services/auth.service.js";

interface MockUserInfo {
  email?: string;
  given_name?: string;
  family_name?: string;
  sub: string;
  picture?: string;
}

interface MockResponse {
  ok: boolean;
  json: () => Promise<MockUserInfo>;
}

const TEST_USER_ID = "auth-svc-google-sub-001";

async function cleanTestUsers() {
  await pool.query(
    "DELETE FROM users WHERE user_id LIKE 'auth-svc-%' OR user_id LIKE 'auth-ctrl-%'"
  );
}

async function withMockedFetch(
  payload: MockUserInfo,
  ok = true
): Promise<(typeof globalThis.fetch)> {
  const original = globalThis.fetch;
  globalThis.fetch = ((url: string | URL) => {
    const u = url.toString();
    if (u.includes("oauth2/v3/userinfo")) {
      return Promise.resolve({
        ok,
        json: () => Promise.resolve(payload),
      } as MockResponse);
    }
    return original(url as string);
  }) as typeof globalThis.fetch;
  return original;
}

export async function runAuthServiceTests() {
  console.log("=========================================");
  console.log("  RUNNING AUTH SERVICE TESTS");
  console.log("=========================================\n");

  try {
    await cleanTestUsers();

    // 1. googleAuth2 — new user (create path)
    {
      const restore = await withMockedFetch({
        email: "auth.svc.new@example.com",
        given_name: "AuthNew",
        family_name: "User",
        sub: TEST_USER_ID,
        picture: "https://example.com/auth-new.png",
      });

      try {
        const result = await googleAuth2("fake-access-token");
        if (!result.jwtString || typeof result.jwtString !== "string") {
          throw new Error("googleAuth2 did not return a jwtString");
        }
        if (!result.user || result.user.userId !== TEST_USER_ID) {
          throw new Error("googleAuth2 did not return the created user");
        }
        if (result.user.email !== "auth.svc.new@example.com") {
          throw new Error("googleAuth2 returned user with wrong email");
        }
        console.log("✓ googleAuth2 (new user) -> created user + JWT returned");
      } finally {
        globalThis.fetch = restore;
      }
    }

    // 2. googleAuth2 — existing user (update path)
    {
      const restore = await withMockedFetch({
        email: "auth.svc.updated@example.com",
        given_name: "AuthUpdated",
        family_name: "User",
        sub: TEST_USER_ID,
        picture: "https://example.com/auth-updated.png",
      });

      try {
        const result = await googleAuth2("fake-access-token");
        if (!result.jwtString) {
          throw new Error("googleAuth2 did not return a jwtString on update");
        }
        if (!result.user || result.user.userId !== TEST_USER_ID) {
          throw new Error("googleAuth2 did not return the existing user");
        }
        if (result.user.givenName !== "AuthUpdated") {
          throw new Error("googleAuth2 did not update the user givenName");
        }
        console.log("✓ googleAuth2 (existing user) -> user updated + JWT returned");
      } finally {
        globalThis.fetch = restore;
      }
    }

    // 3. googleAuth2 — Google userinfo fails (error path)
    {
      const restore = await withMockedFetch(
        { sub: TEST_USER_ID } as MockUserInfo,
        false /* ok = false */
      );

      try {
        await googleAuth2("bad-token");
        throw new Error("Expected googleAuth2 to throw on failed userinfo");
      } catch (error: any) {
        if (!error.message.includes("Error on authentication")) {
          throw new Error(
            `Expected auth error, got: ${error.message}`
          );
        }
        console.log("✓ googleAuth2 (failed userinfo) -> throws auth error");
      } finally {
        globalThis.fetch = restore;
      }
    }

    await cleanTestUsers();
    console.log("\n✅ ALL AUTH SERVICE TESTS PASSED!\n");
  } catch (error) {
    await cleanTestUsers();
    console.error("\n❌ AUTH SERVICE TEST FAILED:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Standalone execution support
if (
  process.argv[1]?.endsWith("auth.service.test.ts") ||
  process.argv[1]?.endsWith("auth.service.test.js")
) {
  runAuthServiceTests().catch(() => process.exit(1));
}