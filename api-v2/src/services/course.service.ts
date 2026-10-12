import { db } from "../db/index.js";
import { courses } from "../db/schema/courses.js";
import { and, asc, isNotNull, ne } from "drizzle-orm";

export async function getUniqueCampuses(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ campus: courses.campus })
    .from(courses)
    .where(
      and(
        isNotNull(courses.campus),
        ne(courses.campus, ""),
      ),
    )
    .orderBy(asc(courses.campus));

  return rows.map(row => row.campus!);
}

