import requests
from bs4 import BeautifulSoup
from requests.adapters import Retry
from requests.sessions import Session
from urllib3.util.retry import Retry
import time

burl = 'https://catalog.missouri.edu/courseofferings/'

def scraper(url):
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    session = Session()
    adapter = requests.adapters.HTTPAdapter(max_retries=retries)
    session.mount('http://', adapter)
    session.mount('https://', adapter)

    response = session.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    cnames = []
    course_blocks = soup.find_all(class_='courseblocktitle')
    for block in course_blocks:
        cnames.append(block.text.strip())
    return cnames

acnames = []
departments_url = 'https://catalog.missouri.edu/courseofferings/'
response_departments = requests.get(departments_url)
soup_departments = BeautifulSoup(response_departments.content, 'html.parser')
department_list = soup_departments.find('div', id='co_departments')

for department_link in department_list.find_all('a', href=True):
    
    department_url = f'https://catalog.missouri.edu{department_link["href"]}/'
    
    cnames = scraper(department_url)
    
    acnames.extend(cnames)
    
    time.sleep(1)

output_file_path = 'scraped_course_names.txt'
with open(output_file_path, 'w') as file:
    for cname in acnames:
        file.write(cname + '\n')

print(f'Scraped course names saved to {output_file_path}')
