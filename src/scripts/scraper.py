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
part = int(sys.argv[2])

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

no_courses = len(course_list)

q2 = no_courses // 2
q1 = q2 // 2
q3 = q2 + q1

match part:
    case 1: 
        start, end = 0, q1
    case 2:
        start, end = q1, q2
    case 3:
        start, end = q2, q3
    case 4:
        start, end = q3, no_courses
    case _:
        start, end = 0, no_courses

i = start
        
while i < end:
    course_classes = []
    k = i + 25 if i + 25 <= end else end
    
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

#####################################################################################################################################################################################################

# Gets dates for the schedule
basis_date = datetime.strptime(class_schedules[0]['TIME_TABLE_DATE'], "%Y-%m-%d").date()
basis_day = basis_date.weekday()
days_of_week = ['M', 'T', 'W', 'H', 'F', 'S', 'U']
week = { str(basis_date + timedelta(days = i - basis_day)): days_of_week[i] for i in range(7) }

# Finds schedules that fit within the week
week_schedules = list(filter(lambda item: item['TIME_TABLE_DATE'] in week.keys(), class_schedules))

courses = []
course_enrollments = []
course_timeslots = []
course_dict = {}
i = 0

# Parses main course info and course enrollment info
for item in classes:
    course_id = len(courses) + 1

    course_code = item["SUBJECT_NAME"].split(' - ')[0]
    course_dict_key = course_code + " - " + item["SECTION_NAME"]
    course_dict[course_dict_key] = course_id

    courses.append({
        "courseId": course_id,
        "courseName": item["SUBJECT_NAME"],
        "section": item["SECTION_NAME"],
        "term": current_term_name
    })

    course_enrollments.append({
        "courseId": course_id,
        "enrollCap": item["CAPACITY"],
        "enrolled": item["ENLISTED"]
    })

class_sessions = { item: 0 for item in course_dict.keys() }
class_online_sessions = class_sessions.copy()

# Parses course schedules
for item in week_schedules:
    item_classes = list(set(item["COURSE_NAME"].split(" <br/> ")))

    for item_class in item_classes:
        class_info = list(map(lambda x: x.split(":")[-1].strip(), item_class.split("</span><span>")))

        class_section = class_info[5]
        class_start = datetime.strptime(item["TIME_FROM"], "%I:%M %p").strftime("%H:%M")
        class_end = datetime.strptime(item["TIME_TO"], "%I:%M %p").strftime("%H:%M")
        class_room = class_info[2]
        class_instructor = class_info[3]

        course_dict_key = item["COURSE_CODE"] + " - " + class_section

        class_course_id = course_dict.get(course_dict_key)
        class_day = week.get(item["TIME_TABLE_DATE"])
        class_time = class_start + " - " + class_end

        course_timeslots.append({
            "courseId": class_course_id,
            "day": class_day,
            "time": class_time,
            "room": class_room,
            "instructor": class_instructor
        })

        class_sessions[course_dict_key] += 1

        if class_room == "Online" or class_room == "-":
            class_online_sessions[course_dict_key] += 1

for item in class_online_sessions.keys():
    course, section = item.split(' - ')

    sessions = class_sessions[item]
    online_sessions = class_online_sessions[item]

    match online_sessions:
        case 0:
            modality = "Predominantly In-Person"
        case _ if online_sessions == sessions:
            modality = "Full Online"
        case _:
            modality = "Hybrid"

    course_idx = next((idx for idx, item in enumerate(courses) if course in item["courseName"] and item["section"] == section), -1)
    courses[course_idx]["modality"] = modality

# Combines all parsed information into a single JSON object
info = [courses, course_timeslots, course_enrollments]
print(json.dumps(info, indent=4))