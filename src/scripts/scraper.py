import requests
import json
from datetime import timedelta, datetime
import sys

# URL FOR TERM/CAMPUS SELECTION, COURSE LIST, AND CLASS LIST
url = "https://archershub.dlsu.edu.ph/CourseFinder/GetAllDropDownList"
url2 = "https://archershub.dlsu.edu.ph/CourseFinder/GetCourseList/"
url3 = "https://archershub.dlsu.edu.ph/CourseFinder/GetCFData/"
url4 = "https://archershub.dlsu.edu.ph/CourseFinder/GetScheduleData/"

session_id = sys.argv[1]

# GET COOKIES FROM AH
cookies = {
    "ASP.NET_SessionId": session_id,
}

headers = {
    'Accept': '*/*;',
    'X-Requested-With': 'XMLHttpRequest',
}

r = requests.Session()

# Fetches list of terms
fetch_sessions = r.post(url, headers=headers, cookies=cookies)
sessions = fetch_sessions.json()
campuses = { item['CAMPUSNAME']: item['CAMPUSNO'] for item in sessions['CampusDrp'] }
current_term = next(item for item in sessions['SessionDrp'] if item['IS_CURRENT_SESSION'] == True)

#####################################################################################################################################################################################################

current_term_name = current_term['ACADEMIC_SESSION_NAME']
current_term_no = current_term['ACADEMIC_SESSION_ID']

selected_campus = 'Manila'

payload = {
    "Campusno": campuses.get(selected_campus),
    "AcademicSession": current_term_no
}

# Fetches list of courses offered for the selected term
fetch_courses = r.post(url2, json=payload, headers=headers, cookies=cookies)
course_list = fetch_courses.json()['CourseDrp']

#####################################################################################################################################################################################################

classes = []
class_schedules = []

while i < len(course_list):
    course_classes = []
    k = i + 25 if i + 25 <= len(course_list) else len(course_list)
    
    for j in range(i, k):
        payload["Courseid"] = course_list[j]["COURSE_CREATION_ID"]

        # Fetches offerings for selected course
        fetch_classes = r.post(url3, json=payload, headers=headers, cookies=cookies)
        course_classes.extend(fetch_classes.json())
        classes.extend(course_classes)

    enlistmentSchedule = []

    for item in course_classes:
        enlistmentSchedule.append({
            'COURSE_CREATION_ID': item['COURSE_CREATION_ID'],
            'SECTION_CREATION_ID': item['SECTION_CREATION_ID'],
            'BATCH_CREATION_ID': item['BATCH_CREATION_ID'],
            'CAMPUSNO': payload['Campusno']
        })

    # Payload for fetching class schedules
    payload_classes = {
        'ACADEMICSESSIONID': payload['AcademicSession'],
        'enlistmentSchedule': enlistmentSchedule
    }

    # Fetches class schedules per offering
    fetch_class_schedules = r.post(url4, json=payload_classes, headers=headers, cookies=cookies)
    course_class_schedules = fetch_class_schedules.json()
    class_schedules.extend(course_class_schedules)

    i += 25

