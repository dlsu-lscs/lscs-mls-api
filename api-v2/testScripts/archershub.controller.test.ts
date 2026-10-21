import Fastify from "fastify";
import cors from "@fastify/cors";

// First, create a mock module by patching the service file's exports
// We do this by creating a test-specific wrapper that loads the routes with mocked service

// Mock implementations
const mockFetchDropdowns = async () => ({
  CampusDrp: [
    { CAMPUSNAME: "Main Campus", CAMPUSNO: "1" },
    { CAMPUSNAME: "Satellite Campus", CAMPUSNO: "2" },
  ],
  SessionDrp: [
    { ACADEMIC_SESSION_NAME: "AY 2023-2024", ACADEMIC_SESSION_ID: "1", IS_CURRENT_SESSION: true },
    { ACADEMIC_SESSION_NAME: "AY 2022-2023", ACADEMIC_SESSION_ID: "2", IS_CURRENT_SESSION: false },
  ],
});

const mockFetchCourseDropdown = async (_campusNo: string, _sessionId: string) => [
  { COURSE_CREATION_ID: "101", COURSE_NAME: "TEST - Course One", SUBJECT_CODE: "CS101" },
  { COURSE_CREATION_ID: "102", COURSE_NAME: "TEST - Course Two", SUBJECT_CODE: "CS102" },
];

// Use a before-import approach: monkey-patch at the source before routes load
// Create a temporary patch file approach
import * as archershubService from "../src/services/archershub.service.js";

// Overwrite the functions using direct assignment (not defineProperty)
(archershubService as any).fetchDropdowns = mockFetchDropdowns;
(archershubService as any).fetchCourseDropdown = mockFetchCourseDropdown;

// Now import routes
import archershubRoutes from "../src/routes/archershub.routes.js";

export async function runArchersHubControllerTests() {
  console.log("=========================================");
  console.log("  RUNNING ARCHERSHUB CONTROLLER TESTS");
  console.log("=========================================\n");

  const app = Fastify({ logger: false });
  await app.register(cors);
  await app.register(archershubRoutes);
  await app.ready();

  try {
    // 1. GET /campuses - Returns unique campuses
    {
      const res = await app.inject({ method: "GET", url: "/campuses" });
      if (res.statusCode !== 200) {
        throw new Error(`Expected 200, got ${res.statusCode}: ${res.body}`);
      }
      const campuses = JSON.parse(res.body);
      if (!Array.isArray(campuses)) {
        throw new Error("Expected array response");
      }
      const campusNames = campuses.map((c: any) => c.name);
      if (!campusNames.includes("Main Campus")) {
        throw new Error("Expected 'Main Campus' in results");
      }
      if (!campusNames.includes("Satellite Campus")) {
        throw new Error("Expected 'Satellite Campus' in results");
      }
      console.log("✓ GET /campuses -> 200 OK with unique campuses");
    }

    // 2. GET /terms - Returns unique terms
    {
      const res = await app.inject({ method: "GET", url: "/terms" });
      if (res.statusCode !== 200) {
        throw new Error(`Expected 200, got ${res.statusCode}: ${res.body}`);
      }
      const terms = JSON.parse(res.body);
      if (!Array.isArray(terms)) {
        throw new Error("Expected array response");
      }
      const termNames = terms.map((t: any) => t.name);
      if (!termNames.includes("AY 2023-2024")) {
        throw new Error("Expected 'AY 2023-2024' in results");
      }
      if (!termNames.includes("AY 2022-2023")) {
        throw new Error("Expected 'AY 2022-2023' in results");
      }
      if (terms[0]?.isCurrent !== true) {
        throw new Error("Expected current session first");
      }
      console.log("✓ GET /terms -> 200 OK with unique terms (current first)");
    }

    // 3. GET /courses/list - Requires query params
    {
      const res = await app.inject({
        method: "GET",
        url: "/courses/list?campusNo=1&sessionId=1"
      });
      if (res.statusCode !== 200) {
        throw new Error(`Expected 200, got ${res.statusCode}: ${res.body}`);
      }
      const courses = JSON.parse(res.body);
      if (!Array.isArray(courses)) {
        throw new Error("Expected array response");
      }
      const courseNames = courses.map((c: any) => c.name);
      if (!courseNames.includes("TEST - Course One")) {
        throw new Error("Expected Course One in results");
      }
      if (!courseNames.includes("TEST - Course Two")) {
        throw new Error("Expected Course Two in results");
      }
      console.log("✓ GET /courses/list -> 200 OK with course list");
    }

    // 4. GET /courses/list - Missing params should return 400
    {
      const res = await app.inject({
        method: "GET",
        url: "/courses/list"
      });
      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 for missing params, got ${res.statusCode}: ${res.body}`);
      }
      console.log("✓ GET /courses/list (missing params) -> 400 Bad Request");
    }

    await app.close();
    console.log("\n✅ ALL ARCHERSHUB CONTROLLER TESTS PASSED!\n");
  } catch (error) {
    await app.close();
    console.error("\n❌ ARCHERSHUB CONTROLLER TEST FAILED:", error);
    throw error;
  }
}

// Standalone execution support
if (
  process.argv[1]?.endsWith("archershub.controller.test.ts") ||
  process.argv[1]?.endsWith("archershub.controller.test.js")
) {
  runArchersHubControllerTests().catch(() => process.exit(1));
}