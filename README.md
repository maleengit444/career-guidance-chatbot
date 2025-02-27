# Career Guidance Chatbot

Career Guidance Chatbot is a local, AI-driven conversational assistant designed to help users explore career options, receive personalized guidance, and analyze resumes. It leverages natural language processing and machine learning techniques to provide insightful career advice based on user interactions, quizzes, and resume content.

## Features

- **Conversational Interface:** Engage in natural dialogue to ask career-related questions.
- **Career Quiz:** Take a quiz to receive tailored career recommendations based on your responses.
- **Resume Analysis:** Upload your resume to extract skills and receive suggestions for improvement.
- **Local Deployment:** Run the chatbot locally using Flask, ensuring data privacy and fast response times.

## Technologies

- **Python 3.10+**
- **Flask** – Web framework for the API backend.
- **ChatterBot** – For building the conversational AI.
- **spaCy** – For NLP tasks and resume analysis.
- **PyPDF2** & **python-docx** – For parsing resume files.
- **Git** – Version control system.

## Project Structure
career_guidance_chatbot/ ├── my_chatbot_env/ # Virtual environment (excluded from Git) ├── src/ # Source code for the application │ ├── init.py # (Optional) Package initializer │ ├── bot.py # Main Flask application and chatbot integration │ ├── quiz.py # Module handling career quiz logic and endpoints │ └── resume_analysis.py # Module for resume parsing and analysis ├── data/ # Data files │ └── quiz_data.json # Quiz questions and scoring data ├── uploads/ # Directory for uploaded resumes (ensure proper security) ├── requirements.txt # Python dependencies list └── README.md # Project documentation (this file)

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/maleengit444/career-guidance-chatbot.git
   cd career-guidance-chatbot

