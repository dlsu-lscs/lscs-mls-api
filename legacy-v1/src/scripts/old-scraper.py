# PARSES DATA FROM MLS COURSE OFFERINGS

from bs4 import BeautifulSoup
import requests 
import json
import sys

# Parses main course information
def parse_course(data, course_id):
    course_keys = ["classNumber", "courseName", "section", "remarks"]
    item = {}
    item["course_id"] = course_id
    
    for index, value in enumerate(course_keys):
        item[value] = data[index]
    
    return item

# Parses course timeslot information
def parse_timeslot(data, course_id):
    timeslots_keys = ["day", "time", "room", "instructor"]
    item = []

    for i in data[0]:
        slot = {}
        slot["course_id"] = course_id

        for index, value in enumerate(timeslots_keys):
            if index == 0:
                slot[value] = i
            else:
                slot[value] = data[index]
        item.append(slot)

    return item

# Parses course enrollment information
def parse_enrollment(data, course_id):
    enrollments_keys = ["enrollCap", "enrolled"] 
    item = {}
    item["course_id"] = course_id
    
    for index, value in enumerate(enrollments_keys):
        item[value] = data[index]
    
    return item

i = 9               # Starting index in the scraped data
course_ctr = 0      # Course counter

courses = []
course_enrollments = []
course_timeslots = []

curr_course = {}    # Placeholder for current course data

URL = "https://enroll.dlsu.edu.ph/dlsu/view_course_offerings/view_course_offerings"
id = sys.argv[1]        # Student ID of the user
course = sys.argv[2]    # Course code to search for

search_info = {
    "p_id_no": id,
    "p_button": "Search",
    "p_course_code": course
}

page = requests.get(URL, params = search_info)
soup = BeautifulSoup(page.content, features="html.parser")

if soup.find("p", class_="error"): 
    sys.exit("Error: " + soup.find("p", class_="error").get_text().strip())

scheds_info = soup.find_all("td", class_="data")

while i < len(scheds_info) - 12:
    text = scheds_info[i].get_text().strip()

    # Skip empty entries
    if not text:
        i += 1

    # Check if the entry is a timeslot
    elif not text.isnumeric():
        # Day, time, room
        timeslot = [scheds_info[j].get_text().strip() for j in range(i, i + 3)]
        i += 3

        # Skips to professor entry
        while not scheds_info[i].get_text().strip():
            i += 1
        
        # Professor (if given)
        if (len(scheds_info[i].get_text().strip()) > 5):
            timeslot.append(scheds_info[i].get_text().strip())
            i += 1 
        else:
            timeslot.append("")
        
        timeslot.append(scheds_info[i].get_text().strip())

        course_timeslots.extend(parse_timeslot(timeslot, course_ctr))

    # Entry is a new course
    else:
        course_ctr += 1

        # Class number, course name, section
        course = [scheds_info[j].get_text().strip() for j in range(i, i + 3)]
        i += 3

        # Day, time, room
        timeslot = [scheds_info[j].get_text().strip() for j in range(i, i + 3)]
        i += 3

        # Enrollment cap, number of enrolled students
        enrollment = [scheds_info[j].get_text().strip() for j in range(i, i + 2)]
        i += 2

        # Remarks
        course.append(scheds_info[i].get_text().strip())
        i += 1

        # Skips to professor entry
        while not scheds_info[i].get_text().strip():
            i += 1
        
        # Professor (if given)
        if (len(scheds_info[i].get_text().strip()) > 5):
            timeslot.append(scheds_info[i].get_text().strip())
            i += 1
        else:
            timeslot.append("")


        courses.append(parse_course(course, course_ctr))
        course_enrollments.append(parse_enrollment(enrollment, course_ctr))
        course_timeslots.extend(parse_timeslot(timeslot, course_ctr))

# Combines all parsed information into a single JSON object
info = [courses, course_timeslots, course_enrollments]
print(json.dumps(info, indent=4))
