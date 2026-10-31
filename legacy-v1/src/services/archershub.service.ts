import { fetchDropdowns, fetchCourseDropdown } from 'scripts/archershub.js';

export async function getCampuses() {
    const data = await fetchDropdowns();
    return data.CampusDrp.map((item: any) => ({
        name: item.CAMPUSNAME,
        campusNo: item.CAMPUSNO,
    }));
}

export async function getTerms() {
    const data = await fetchDropdowns();
    const current = data.SessionDrp.find((item: any) => item.IS_CURRENT_SESSION === true);
    const others = data.SessionDrp
        .filter((item: any) =>
            item.ACADEMIC_SESSION_NAME.includes('AY') &&
            item.ACADEMIC_SESSION_ID !== current?.ACADEMIC_SESSION_ID
        )
        .sort((a: any, b: any) => b.ACADEMIC_SESSION_NAME.localeCompare(a.ACADEMIC_SESSION_NAME));

    return [current, ...others]
        .filter(Boolean)
        .map((item: any) => ({
            name: item.ACADEMIC_SESSION_NAME,
            sessionId: item.ACADEMIC_SESSION_ID,
            isCurrent: item.IS_CURRENT_SESSION === true,
        }));
}

export async function getCourseList(campusNo: string, sessionId: string) {
    const courses = await fetchCourseDropdown(campusNo, sessionId);
    return courses.map((item: any) => ({
        courseId: item.COURSE_CREATION_ID,
        name: item.COURSE_NAME ?? item.SUBJECT_CODE ?? item.SUBJECT_NAME,
    }));
}
