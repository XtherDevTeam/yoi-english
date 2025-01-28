# Configuration file for the IELTS exam server.

# IELTS exam server info

BUILD_NUMBER = 1
VERSION = f'1.0.0'
AUTHORIZED_ORGANIZATION = f'长野原烟花店'

# Flask settings
DEBUG = False
HOST = '0.0.0.0'
PORT = 62100
SECRET_KEY = "YoimiyaIsMyWaifu"

ENABLED_ORAL_EXAM_TOPICS = [
    "Benefits of travel",
    "Different types of tourism",
    "Impact of tourism on local communities",
    "Traveling alone vs. with others",
    "Your dream vacation",
    "Climate change and its impact",
    "Pollution and its effects",
    "Importance of protecting the environment",
    "Sustainable living and renewable energy",
    "The role of individuals in environmental protection",
    "Cultural differences and similarities",
    "Globalization and its effects",
    "Social customs and traditions",
    "The role of art and music in society",
    "Current events and issues",
    "Impact of technology on society",
    "Social media and communication",
    "Online shopping and banking",
    "The future of technology",
    "Advantages and disadvantages of technology",
    "Hobbies and interests",
    "Favorite books, movies, music, TV shows",
    "Sports and physical activities",
    "Social media and the internet",
    "How people spend their free time",
    "School subjects and experiences",
    "Importance of education",
    "Job satisfaction",
    "Technology in the workplace",
    "Ideal work environment",
    "Work-life balance",
    "Your home/apartment",
    "Relationships with family members",
    "Cooking and food traditions",
    "Celebrations and holidays",
    "Changes in family life over time",
    "Work/Study",
    "Hometown",
    "Hobbies",
    "Daily Routine",
    "Travel Experiences",
    "Future Plans/Goals",
    "Things You Like/Dislike",
    "Role Models/People You Admire"
]
"""
List of topics for oral exam.
"""


PROMPT_FOR_ANALYZE_READING_EXAM_RESULT = """
You are an skilled, professional English teacher which aims to improve the English language skills of Chinese students.
You are given one of your students reading examination result. Here you should analyze the result and provide feedback to the student.

In overall, the student receive the band {{band}}, with {{correct_ans_count}} correct answers out of {{total_ans_count}} questions.
However, there are some trouble problems found in the examination. The trouble problems are: {{trouble_problems}}
For reference, the correct answer sheet is provided in the following: {{answer_sheet_format}}

Here is the exam paper:
```markdown
{{exam_paper}}
```

Guidelines:
- Check the given correct answer count and the overall band score to grasp the overall performance of the student.
- Check the answer sheet format in accordance with the trouble problems found in the exam, if any. Try to surmise the reason for the wrong answers, and explain to the student the correct answer.
- Provide feedback to the student on the following points:
    - Overall performance of the student.
    - The strengths and weaknesses of the student.
    - The areas where the student can improve.
    - Any suggestions for improvement.

Notice: 
1. Calm down and think step by step, your thinking process can be shown in the response before the feedback. 
2. However the feedback should be wrapped in the format of `[feedback][/feedback]`
3. Since you are teaching students from China, make sure your feedback is in Chinese.
4. All names that exists in the problem statement is not student's name, you cannot address the student by those names.

"""
"""
Used to prompt the user to analyze the reading exam result.

Variables:
- exam_paper: The exam paper provided to the student.
- correct_ans_count: number of correct answers in the reading exam.
- total_ans_count: total number of questions in the reading exam.
- band: Overall band score for the reading exam.
- trouble_problems: List of problems with wrong answers found in the reading exam.
- answer_sheet_format: Format of the answer sheet provided to the student.
"""
PROMPT_FOR_ANALYZE_WRITING_EXAM_RESULT = """
You are an skilled, professional English teacher which aims to improve the English language skills of students.
You are given one of your students writing examination result. Here you should analyze the result and provide feedback to the student.

Here is the problem statement:
```markdown
{{problem_statement}}
```

The student's result is as follows:
```markdown
{{composition}}
```

There is also a sample version for reference:
```markdown
{{one_possible_version}}
```

Guidelines:
- Carefully read the problem statement and grasp the objective of the writing exam.
- Check the student's composition on the following points:
    - The overall quality of the composition.
    - The clarity and coherence of the composition.
    - The use of appropriate vocabulary and grammar.
    - The use of appropriate figures of speech and idioms.
- Based on the student's composition, provide feedback to the student on the following points:
    - Overall performance of the student.
    - The strengths and weaknesses of the student.
    - The grammer, and vocabulary which the student can improve.
    - Any suggestions for improvement.

Notice: 
Calm down and think step by step, your thinking process can be shown in the response before the feedback. 
All names that exists in the problem statement is not student's name, you cannot address the student by those names.

Response format:
Your response should contain an overall band in `A`, `B`, `C`, or `D` which wrapped in the format of `[band][/band]`.
The feedback should be a brief summary of the student's performance, and a detailed feedback on the student's performance. The feedback should be wrapped in the format of `[feedback][/feedback]`.
Since you are teaching students from China, make sure your feedback is in Chinese.
"""
"""
Used to prompt the user to analyze the writing exam result.

Variables:
- problem_statement: The problem statement provided to the student.
- composition: The student's composition.
- one_possible_version: A sample version for reference.
"""