import Fastify from "fastify";
import cors from "@fastify/cors";
import authRoutes from "../src/routes/auth.routes.js";

interface MockResponse {
  ok: boolean;
  json: () => Promise<Record<string, never>>;
}

// Mock fetch so the controller tests are fully deterministic (no network).
function withMockedFetch(
  userinfoOk: boolean,
  tokenOk: boolean
): typeof globalThis.fetch {
  const original = globalThis.fetch;
  globalThis.fetch = ((url: string | URL) => {
    const u = url.toString();
    if (u.includes("oauth2/v3/userinfo")) {
      return Promise.resolve({
        ok: userinfoOk,
        json: () => Promise.resolve({}),
      } as MockResponse);
    }
    if (u.includes("oauth2.googleapis.com/token")) {
      return Promise.resolve({
        ok: tokenOk,
        json: () =>
          Promise.resolve(tokenOk ? { id_token: "fake-id-token" } : {}),
      } as MockResponse);
    }
    return original(url as string);
  }) as typeof globalThis.fetch;
  return original;
}

export async function runAuthControllerTests() {
  console.log("=========================================");
  console.log("  RUNNING AUTH CONTROLLER / ROUTE TESTS");
  console.log("=========================================\n");

  // Build isolated Fastify instance using app.inject() (no open ports needed).
  // The real Google OAuth flow is not exercised here — only the request
  // validation and error-mapping paths that are deterministic.
  const app = Fastify({ logger: false });
  await app.register(cors);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.ready();

  try {
    // 1. POST /auth/google with no token (Validation)
    const resNoToken = await app.inject({
      method: "POST",
      url: "/auth/google",
      payload: {},
    });
    if (resNoToken.statusCode !== 400) {
      throw new Error(
        `Expected 400 for missing token, got ${resNoToken.statusCode}`
      );
    }
    console.log("✓ POST /auth/google (no token) -> 400 Bad Request");

    // 2. GET /auth/google/callback with no code (Validation)
    const resNoCode = await app.inject({
      method: "GET",
      url: "/auth/google/callback",
    });
    if (resNoCode.statusCode !== 400) {
      throw new Error(
        `Expected 400 for missing code, got ${resNoCode.statusCode}`
      );
    }
    console.log("✓ GET /auth/google/callback (no code) -> 400 Bad Request");

    // 3. POST /auth/google with a bad token -> service throws auth error -> 403
    const restore = withMockedFetch(false /* userinfo */, false /* token */);
    try {
      const resBadToken = await app.inject({
        method: "POST",
        url: "/auth/google",
        payload: { token: "invalid-token" },
      });
      if (resBadToken.statusCode !== 403) {
        throw new Error(
          `Expected 403 for invalid token, got ${resBadToken.statusCode}`
        );
      }
      console.log("✓ POST /auth/google (invalid token) -> 403 Forbidden");
    } finally {
      globalThis.fetch = restore;
    }

    // 4. GET /auth/google/callback with a bad code -> 403
    const restore2 = withMockedFetch(false /* userinfo */, false /* token */);
    try {
      const resBadCode = await app.inject({
        method: "GET",
        url: "/auth/google/callback?code=invalid-code",
      });
      if (resBadCode.statusCode !== 403) {
        throw new Error(
          `Expected 403 for invalid code, got ${resBadCode.statusCode}`
        );
      }
      console.log("✓ GET /auth/google/callback (invalid code) -> 403 Forbidden");
    } finally {
      globalThis.fetch = restore2;
    }

    await app.close();
    console.log("\n✅ ALL AUTH CONTROLLER TESTS PASSED!\n");
  } catch (error) {
    await app.close();
    console.error("\n❌ AUTH CONTROLLER TEST FAILED:", error);
    throw error;
  }
}

// Standalone execution support
if (
  process.argv[1]?.endsWith("auth.controller.test.ts") ||
  process.argv[1]?.endsWith("auth.controller.test.js")
) {
  runAuthControllerTests().catch(() => process.exit(1));
}