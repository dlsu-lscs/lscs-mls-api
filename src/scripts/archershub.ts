import fs from 'fs';
import axios from 'axios';

const BASE_URL = 'https://archershub.dlsu.edu.ph/CourseFinder';

function getSessionId(): string {
    if (!fs.existsSync('./ah-cookies.json')) throw new Error('No cookie file found.');
    const raw = fs.readFileSync('./ah-cookies.json').toString().trim();
    if (!raw) throw new Error('No cookies found.');

    const cookies = JSON.parse(raw);
    const session = cookies.find((c: any) => c.name === 'ASP.NET_SessionId');
    if (!session) throw new Error('Session ID not found.');
    return session.value;
}

function getHeaders(sessionId: string) {
    return {
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': `ASP.NET_SessionId=${sessionId}`,
    };
}

export async function fetchDropdowns(): Promise<any> {
    const sessionId = getSessionId();
    const { data } = await axios.post(`${BASE_URL}/GetAllDropDownList`, {}, {
        headers: getHeaders(sessionId),
    });
    return data;
}

export async function fetchCourseDropdown(campusNo: string | number, academicSessionId: string | number): Promise<any[]> {
    const sessionId = getSessionId();
    const { data } = await axios.post(`${BASE_URL}/GetCourseList/`, {
        Campusno: campusNo,
        AcademicSession: academicSessionId,
    }, {
        headers: getHeaders(sessionId),
    });
    return data.CourseDrp ?? [];
}
