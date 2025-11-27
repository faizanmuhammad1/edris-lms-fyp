import sys

# Read the file
with open('j:/Projects/FYP/FYP/app/data/course/get-all-courses.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace HTML entities with regular ampersands
content = content.replace('Finance &amp; Accounting', 'Finance & Accounting')
content = content.replace('IT &amp; Software', 'IT & Software')
content = content.replace('Health &amp; Fitness', 'Health & Fitness')

# Write back
with open('j:/Projects/FYP/FYP/app/data/course/get-all-courses.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed category names!")
