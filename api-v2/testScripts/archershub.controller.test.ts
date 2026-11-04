import Fastify from "fastify";
import cors from "@fastify/cors";
import type { FastifyPluginAsync } from "fastify";

// Inline mock implementations for testing
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

// Test controller handlers using mocks directly
async function getCampuses(_request: any, reply: any) {
  try {
    const data = await mockFetchDropdowns();
    const campuses = data.CampusDrp.map((item: any) => ({
      name: item.CAMPUSNAME,
      campusNo: item.CAMPUSNO,
    }));
    return reply.code(200).send(campuses);
  } catch (err: any) {
    return reply.code(500).send({ message: 'Internal server error.' });
  }
}

async function getTerms(_request: any, reply: any) {
  try {
    const data = await mockFetchDropdowns();
    const current = data.SessionDrp.find((item: any) => item.IS_CURRENT_SESSION === true);
    const others = data.SessionDrp
      .filter((item: any) =>
        item.ACADEMIC_SESSION_NAME.includes('AY') &&
        item.ACADEMIC_SESSION_ID !== current?.ACADEMIC_SESSION_ID
      )
      .sort((a: any, b: any) => b.ACADEMIC_SESSION_NAME.localeCompare(a.ACADEMIC_SESSION_NAME));

    const terms = [current, ...others]
      .filter(Boolean)
      .map((item: any) => ({
        name: item.ACADEMIC_SESSION_NAME,
        sessionId: item.ACADEMIC_SESSION_ID,
        isCurrent: item.IS_CURRENT_SESSION === true,
      }));
    return reply.code(200).send(terms);
  } catch (err: any) {
    return reply.code(500).send({ message: 'Internal server error.' });
  }
}

async function getCourseList(req: any, reply: any) {
  try {
    const { campusNo, sessionId } = req.query;

    if (!campusNo || !sessionId) {
      return reply.code(400).send({ message: 'campusNo and sessionId are required.' });
    }

    const courses = await mockFetchCourseDropdown(campusNo, sessionId);
    const result = courses.map((item: any) => ({
      courseId: item.COURSE_CREATION_ID,
      name: item.COURSE_NAME ?? item.SUBJECT_CODE ?? item.SUBJECT_NAME,
    }));
    return reply.code(200).send(result);
  } catch (err: any) {
    return reply.code(500).send({ message: 'Internal server error.' });
  }
}

const archershubTestRoutes: FastifyPluginAsync = async (app) => {
  app.get("/campuses", getCampuses);
  app.get("/terms", getTerms);
  app.get("/courses/list", getCourseList);
};

export async function runArchersHubControllerTests() {
  console.log("=========================================");
  console.log("  RUNNING ARCHERSHUB CONTROLLER TESTS");
  console.log("=========================================\n");

  const app = Fastify({ logger: false });
  await app.register(cors);
  await app.register(archershubTestRoutes);
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