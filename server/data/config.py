# Configuration file for the IELTS exam server.

# IELTS exam server info

BUILD_NUMBER = 1
VERSION = f'1.0.0({BUILD_NUMBER})'

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