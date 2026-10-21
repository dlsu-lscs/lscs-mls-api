import { db } from "../db/index.js";
import { and, eq, inArray } from "drizzle-orm";

import { selectedCourses } from "../db/schema/selected-courses.js";
import { courses } from "../db/schema/courses.js";
import { courseEnrollments } from "../db/schema/course_enrollments.js";
import { courseTimeslots } from "../db/schema/course_timeslots.js";

import type { SelectedCourse, CreateSelectedCourse } from "../dtos/selected-course.dto.js";
import type { CourseInformation } from "../dtos/course-information.dto.js";
import { getCourseById as getCourseByIdFromCourseService } from "./course.service.js";

export async function addSelectedCourse(
  userId: number,
  courseId: number,
): Promise<{ success: boolean; message: string }> {
  // 1. Check if the course exists
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.cid, courseId))
    .limit(1);

  if (!course) {
    return { success: false, message: "Course not found." };
  }

  // 2. Check if already saved
  const existing = await db
    .select()
    .from(selectedCourses)
    .where(
      and(
        eq(selectedCourses.userId, userId),
        eq(selectedCourses.courseId, courseId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { success: false, message: "Course already saved." };
  }

  // 3. Conflict Detection: Get timeslots of the new course
  const newCourseTimeslots = await db
    .select({ day: courseTimeslots.day, time: courseTimeslots.time })
    .from(courseTimeslots)
    .where(eq(courseTimeslots.courseId, courseId));

  if (newCourseTimeslots.length === 0) {
    return { success: false, message: "Course has no timeslots; cannot check conflicts." };
  }

  // 4. Get timeslots of all courses the user has already saved
  const savedCourseIds = await db
    .select({ courseId: selectedCourses.courseId })
    .from(selectedCourses)
    .where(eq(selectedCourses.userId, userId));

  if (savedCourseIds.length > 0) {
    const savedCourseIdList = savedCourseIds.map((s) => s.courseId);

    // Get all timeslots for the user's saved courses
    const savedTimeslots = await db
      .select({
        day: courseTimeslots.day,
        time: courseTimeslots.time,
        courseId: courseTimeslots.courseId,
      })
      .from(courseTimeslots)
      .where(inArray(courseTimeslots.courseId, savedCourseIdList));

    // Check for overlap: same day AND overlapping time
    for (const newTs of newCourseTimeslots) {
      // Filter saved timeslots to the same day
      const sameDaySaved = savedTimeslots.filter((ts) => ts.day === newTs.day);

      for (const savedTs of sameDaySaved) {
        if (timesOverlap(newTs.time, savedTs.time)) {
          return {
            success: false,
            message: `Schedule conflict on ${newTs.day} ${newTs.time} with another saved course.`,
          };
        }
      }
    }
  }

  // 5. No conflicts - insert the selected course
  await db.insert(selectedCourses).values({
    userId,
    courseId,
  });

  return { success: true, message: "Course saved successfully." };
}

export async function getUserSelectedCourses(
  userId: number,
): Promise<CourseInformation[]> {
  // Get all selected course IDs for this user
  const saved = await db
    .select({ courseId: selectedCourses.courseId })
    .from(selectedCourses)
    .where(eq(selectedCourses.userId, userId));

  if (saved.length === 0) {
    return [];
  }

  const courseIds = saved.map((s) => s.courseId);

  // Fetch full course information for all saved courses using the existing getCourseById
  // This reuses the join logic from course.service.ts
  const results: CourseInformation[] = [];
  for (const cid of courseIds) {
    const courseInfo = await getCourseByIdFromCourseService(cid);
    if (courseInfo) {
      results.push(courseInfo);
    }
  }

  return results;
}

export async function removeSelectedCourse(
  userId: number,
  courseId: number,
): Promise<{ success: boolean; message: string }> {
  const result = await db
    .delete(selectedCourses)
    .where(
      and(
        eq(selectedCourses.userId, userId),
        eq(selectedCourses.courseId, courseId),
      ),
    );

  if ((result.rowCount ?? 0) > 0) {
    return { success: true, message: "Course removed from saved courses." };
  }
  return { success: false, message: "Saved course not found." };
}

// Helper: parse time string like "08:00-10:00" and check for overlap
function timesOverlap(time1: string, time2: string): boolean {
  const [start1, end1] = parseTimeRange(time1);
  const [start2, end2] = parseTimeRange(time2);

  if (!start1 || !end1 || !start2 || !end2) {
    return false; // If we can't parse, assume no overlap to be safe
  }

  // Overlap exists if start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1;
}

function parseTimeRange(timeStr: string): [number, number] | [null, null] {
  // Format: "HH:MM-HH:MM" or "H:MM-H:MM"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!match) {
    return [null, null];
  }
  const startHours = parseInt(match[1], 10);
  const startMinutes = parseInt(match[2], 10);
  const endHours = parseInt(match[3], 10);
  const endMinutes = parseInt(match[4], 10);

  const start = startHours * 60 + startMinutes;
  const end = endHours * 60 + endMinutes;

  return [start, end];
}

// Re-export getCourseById from course.service
export { getCourseByIdFromCourseService as getCourseById };