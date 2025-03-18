const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log("Loaded API Key:", process.env.GEMINI_API_KEY ? "✅ Exists" : "❌ Missing");

// Store user data temporarily
const userSessions = {}; // Format: { sessionId: { name, step, quiz, previousInteractions: [] } }

// Helper function to check if a question is career-related
function isCareerQuestion(userInput) {
    const careerKeywords = [
        "career", "job", "work", "resume", "cv", "internship", 
        "skills", "interview", "profession", "education", "courses", 
        "certification", "salary", "hiring", "employment"
    ];
    return careerKeywords.some(keyword => userInput.toLowerCase().includes(keyword));
}

// API endpoint for chatbot
app.post("/ask", async (req, res) => {
    try {
        const { sessionId, question } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: "Missing session ID" });
        }

        // Initialize session if not exists
        if (!userSessions[sessionId]) {
            userSessions[sessionId] = { step: 1, previousInteractions: [] };
        }

        let session = userSessions[sessionId];

        // Check if this is a special request for the Skill Quiz
        if (question.toLowerCase().includes("skill assessment quiz")) {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

            const systemPrompt = `
            You are a career guidance chatbot. Generate a skill assessment quiz for the user.
            The quiz should be interactive, providing multiple-choice questions with options.
            Focus only on career-related skills and recommendations.
            Return the questions and options in a structured format like:

            Question 1: What is your proficiency in programming languages?
            Options: 
            a) Beginner
            b) Intermediate
            c) Advanced

            Provide a minimum of 3 questions for the user to answer.
            `;

            const result = await model.generateContent(systemPrompt);

            if (!result || !result.response) {
                return res.status(500).json({ error: "Failed to generate skill assessment quiz." });
            }

            const response = result.response.text();
            session.quiz = response;

            return res.json({ answer: response, isQuiz: true });
        }

        // Check if the question is career-related
        if (!isCareerQuestion(question) && session.step === 5) {
            return res.json({ answer: "I'm here to help with career-related questions only." });
        }

        // Step 1: Ask for Name
        if (session.step === 1) {
            session.step = 2;
            return res.json({ answer: "Hello! Before we start, what is your name?" });
        }

        // Step 2: Store Name and Proceed to Career Assistance
        if (session.step === 2) {
            session.name = question;
            session.step = 3;
            return res.json({ 
                answer: `Nice to meet you, ${session.name}! How can I assist you with your career today?`
            });
        }

        // Step 3: Proceed Directly to Career Conversation Mode
        if (session.step === 3) {
            session.step = 5;  
            return res.json({ 
                answer: `Great! You can now ask me anything related to careers, jobs, skills, or education.`
            });
        }

        // Step 5: Answer Career Questions
        if (session.step === 5) {
            if (!isCareerQuestion(question)) {
                return res.json({ answer: "I'm here to help with career-related questions only." });
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

            const systemPrompt = `
            You are a career guidance chatbot. Your role is to provide career-related advice only. 
            User's name is **${session.name}**.
            Focus only on career paths, job opportunities, required skills, education, salary expectations, and career development.
            Do not answer any non-career-related questions.

            User: ${question}
            `;

            const result = await model.generateContent(systemPrompt);

            if (!result || !result.response) {
                return res.status(500).json({ error: "Invalid API response from Gemini API" });
            }

            const response = result.response.text();
            session.previousInteractions.push({ question, response });

            res.json({ answer: response });
        }

    } catch (error) {
        res.status(500).json({ error: "Something went wrong", details: error.message });
    }
});

// API endpoint for processing quiz answers
app.post("/quiz", async (req, res) => {
    try {
        const { sessionId, answers } = req.body;

        if (!sessionId || !answers) {
            return res.status(400).json({ error: "Invalid request. Session ID and answers are required." });
        }

        const session = userSessions[sessionId];
        if (!session || !session.quiz) {
            return res.status(400).json({ error: "No active quiz found for this session." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

        const systemPrompt = `
        You are a career guidance chatbot. 
        The user has completed a skill assessment quiz. 
        Analyze their answers and provide detailed feedback about their strengths and areas to improve.
        Recommend specific resources or steps to enhance their skills.
        
        User's Answers: ${JSON.stringify(answers)}
        `;

        const result = await model.generateContent(systemPrompt);

        if (!result || !result.response) {
            return res.status(500).json({ error: "Failed to process quiz answers." });
        }

        const feedback = result.response.text();
        res.json({ feedback });
        
    } catch (error) {
        res.status(500).json({ error: "Something went wrong", details: error.message });
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
