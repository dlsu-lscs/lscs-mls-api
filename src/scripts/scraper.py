import requests
import json
from datetime import timedelta, datetime
import sys
import copy
import time

# URL FOR TERM/CAMPUS SELECTION, COURSE LIST, AND CLASS LIST
url = "https://archershub.dlsu.edu.ph/CourseFinder/GetAllDropDownList"
url2 = "https://archershub.dlsu.edu.ph/CourseFinder/GetCourseList/"
url3 = "https://archershub.dlsu.edu.ph/CourseFinder/GetCFData/"
url4 = "https://archershub.dlsu.edu.ph/CourseFinder/GetScheduleData/"

session_id = sys.argv[1]
campus = int(sys.argv[2]) if sys.argv[2] else 0
part = int(sys.argv[3]) if sys.argv[3] else 0
term = int(sys.argv[4]) if sys.argv[4] else 0

# GET COOKIES FROM AH
cookies = {
    "__Secure-SID": session_id,
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
current_term = next((item for item in sessions['SessionDrp'] if item['IS_CURRENT_SESSION'] == True), sessions['SessionDrp'][0])
other_terms = [item for item in sessions['SessionDrp']]
other_terms.sort(reverse=True, key=lambda x: x['ACADEMIC_SESSION_NAME'])

#####################################################################################################################################################################################################

if term > 0 and term <= len(other_terms):
    chosen_term_name = other_terms[term - 1]['ACADEMIC_SESSION_NAME']
    chosen_term_no = other_terms[term - 1]['ACADEMIC_SESSION_ID']
else:
    chosen_term_name = current_term['ACADEMIC_SESSION_NAME']
    chosen_term_no = current_term['ACADEMIC_SESSION_ID']

match campus:
    case 1:
        selected_campus = 'Laguna'
    case 2: 
        selected_campus = 'Rufino'
    case _:
        selected_campus = 'Manila'

payload = {
    "Campusno": campuses.get(selected_campus),
    "AcademicSession": chosen_term_no
}

# Fetches list of courses offered for the selected term
fetch_courses = r.post(url2, json=payload, headers=headers, cookies=cookies)
course_list = fetch_courses.json()['CourseDrp']

#####################################################################################################################################################################################################

classes = []
no_courses = len(course_list)

q2 = no_courses // 2
q1 = q2 // 2
q3 = q2 + q1
oe = q1 // 2

half = part % 2 if part > 0 and part <= 8 else -1
part = (part - 1) // 2 + 1 if part > 0 and part <= 8 else part

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

match half:
    case 1:
        start, end = start, end - oe
    case 0:
        start, end = start - oe + 1, end

i = start
        
while i < end:
    k = min(i + 25, end)   
    
    for j in range(i, k):
        payload["Courseid"] = course_list[j]["COURSE_CREATION_ID"]

        response = r.post(url3, json=payload, headers=headers, cookies=cookies)
        new_classes = response.json()
        
        classes.extend(new_classes) 
        
        time.sleep(0.5)
        
    i += 25
  
#####################################################################################################################################################################################################

days_abbr = {
    'MONDAY':     'M',
    'TUESDAY':    'T',
    'WEDNESDAY':  'W',
    'THURSDAY':   'H',
    'FRIDAY':     'F',
    'SATURDAY':   'S',
    'SUNDAY':     'U'
}

courses = []
course_enrollments = []
course_timeslots = []
course_dict = {}
i = 0

# Parses main course info and course enrollment info
for item in classes:
    course_id = len(courses) + 1
    class_schedules = {}
    ol_sessions = 0
    ip_sessions = 0

    course_code = item["SUBJECT_NAME"].split(' - ')[0]
    course_dict_key = course_code + " - " + item["SECTION_NAME"]
    course_dict[course_dict_key] = course_id
    class_instructor = item["MAIN_TEACHER"]

    course = {
        "courseId": course_id,
        "courseName": item["SUBJECT_NAME"],
        "section": item["SECTION_NAME"],
        "remarks": item["SECTION_REMARKS"],
        "term": chosen_term_name,
        "campus": selected_campus
    }

    course_enrollment = {
        "courseId": course_id,
        "enrollCap": item["CAPACITY"],
        "enrolled": item["ENLISTED"]
    }

    schedules_info = item["SCHEDULE"].replace('[ ', '').replace(' ]', '').split(' | ')

    for schedule in schedules_info:
        temp = schedule.split(' - ', 1)
        class_day = days_abbr[temp[0]]

        temp = temp[1].split(' : ')
        class_start, class_end = temp[0].strip().split(' - ')
        class_room = temp[1].replace('Room - ', '') if len(temp) > 1 else ''
        
        if class_day in class_schedules:
            if not class_room:
                class_room = class_schedules[class_day]["room"]
            elif class_schedules[class_day]["room"]:
                class_room = f"{class_schedules[class_day]["room"]}/{class_room}"

        class_schedules[class_day] = {
            "start": datetime.strptime(class_start, "%I:%M %p").strftime("%H:%M"),
            "end": datetime.strptime(class_end, "%I:%M %p").strftime("%H:%M"),
            "room": class_room
        }

    for day in class_schedules.keys():
        timeslot = class_schedules[day]
        class_time = timeslot["start"] + "-" + timeslot["end"]
        class_room = timeslot["room"]

        course_timeslots.append({
            "courseId": course_id,
            "day": day,
            "time": class_time,
            "room": class_room,
            "instructor": class_instructor
        })

        ol_sessions = ol_sessions + ("Online" in class_room)
        ip_sessions = ip_sessions + (class_room and "Online" not in class_room)

    if ol_sessions > 0 and ip_sessions > 0:
        modality = "Hybrid"
    elif ol_sessions > 0:
        modality = "Predominantly Online"
    elif ip_sessions > 0:
        modality = "Predominantly In-Person"
    else:
        modality = "TBD"

    course["modality"] = modality

    courses.append(course)
    course_enrollments.append(course_enrollment)

# Combines all parsed information into a single JSON object
info = [courses, course_timeslots, course_enrollments]
print(json.dumps(info, indent=4))