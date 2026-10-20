import {
  getUniqueCampuses,
  getUniqueTerms,
  getCourseList
} from "./course.service.js";

export async function getCampuses(): Promise<string[]> {
  return getUniqueCampuses();
}

export async function getTerms(): Promise<string[]> {
  return getUniqueTerms();
}

export async function getCoursesList(): Promise<string[]> {
  return getCourseList();
}