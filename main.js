// Generate a unique session ID (to track user interactions)
const sessionId = "session-" + Math.random().toString(36).substr(2, 9);

// Store the user's name (if provided)
let userName = "";

// Function to display messages in the chat window
function displayMessage(sender, message) {
    const chatWindow = document.querySelector(".chat-window .chat");
    const messageDiv = `<div class="${sender}"><p>${message}</p></div>`;
    chatWindow.insertAdjacentHTML("beforeend", messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll
}

// Function to show typing indicator
function showTypingIndicator() {
    const chatWindow = document.querySelector(".chat-window .chat");
    const typingIndicator = `
        <div class="model typing-indicator" id="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    chatWindow.insertAdjacentHTML("beforeend", typingIndicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Function to remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) typingIndicator.remove();
}

// Function to send a message to the chatbot
async function sendMessage() {
    const inputField = document.querySelector(".chat-window input");
    const userMessage = inputField.value.trim();
    if (!userMessage) return;

    displayMessage("user", userMessage);
    inputField.value = ""; 

    showTypingIndicator();

    try {
        const response = await fetch("http://localhost:5000/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, question: userMessage })
        });

        const data = await response.json();
        removeTypingIndicator();

        if (data.isQuiz) {
            displayQuiz(data.answer);  // Display interactive quiz
        } else if (data.answer) {
            displayMessage("model", data.answer);

            if (data.answer.includes("Nice to meet you")) {
                userName = userMessage;
                document.getElementById("chat-title").textContent = `Hello, ${userName}!`;
            }
        }

    } catch (error) {
        console.error("Error communicating with chatbot:", error);
        displayMessage("model", "Error: Failed to communicate with chatbot.");
        removeTypingIndicator();
    }
}

// Handle Skill Assessment Quiz
document.getElementById("quiz-trigger").addEventListener("click", () => {
    fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question: "skill assessment quiz" })
    })
    .then(response => response.json())
    .then(data => {
        if (data.isQuiz) displayQuiz(data.answer);
    })
    .catch(error => console.error("Error generating quiz:", error));
});

// Display the Skill Assessment Quiz
function displayQuiz(quizText) {
    const quizContent = document.getElementById("quiz-content");
    const questions = parseQuiz(quizText);
    let quizHTML = `<h2>Skill Assessment Quiz</h2><form id="quiz-form">`;

    questions.forEach((question, index) => {
        quizHTML += `<div class="quiz-question"><p>${question.question}</p>`;
        question.options.forEach(option => {
            quizHTML += `
                <div>
                    <input type="radio" name="question${index}" value="${option}" id="${option}-${index}">
                    <label for="${option}-${index}">${option}</label>
                </div>
            `;
        });
        quizHTML += `</div>`;
    });

    quizHTML += `<button id="submit-quiz" type="button">Submit Quiz</button></form>`;
    quizContent.innerHTML = quizHTML;

    document.getElementById("quiz-popup").style.display = "flex";
    document.getElementById("submit-quiz").addEventListener("click", submitQuiz);
}

// Parse the quiz text returned by the API
function parseQuiz(quizText) {
    const questions = [];
    const parts = quizText.split("Question ");

    parts.forEach(part => {
        if (part.trim() === "") return;

        const lines = part.split("\n").filter(line => line.trim() !== "");
        const questionText = lines[0].trim();

        const options = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim().startsWith("Options:")) {
                const optionLines = lines.slice(i + 1);
                optionLines.forEach(optionLine => {
                    const optionText = optionLine.trim().replace(/^[a-z]\)/i, "").trim();
                    if (optionText) options.push(optionText);
                });
                break;
            }
        }

        questions.push({ question: questionText, options });
    });

    return questions;
}

// Submit Quiz and Fetch Feedback
async function submitQuiz() {
    const form = document.getElementById("quiz-form");
    const formData = new FormData(form);
    const answers = {};

    for (let [key, value] of formData.entries()) {
        answers[key] = value;
    }

    document.getElementById("quiz-content").innerHTML = `<h2>Evaluating your answers...</h2>`;

    try {
        const response = await fetch("http://localhost:5000/quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, answers })
        });

        const data = await response.json();

        if (data.feedback) {
            document.getElementById("quiz-content").innerHTML = `
                <h2>Skill Assessment Feedback</h2>
                <p>${data.feedback}</p>
                <button id="quiz-close">Close</button>
            `;
            document.getElementById("quiz-close").addEventListener("click", () => {
                document.getElementById("quiz-popup").style.display = "none";
            });
        } else {
            document.getElementById("quiz-content").innerHTML = `<p>Failed to process your answers. Please try again.</p>`;
        }

    } catch (error) {
        console.error("Error processing quiz answers:", error);
        document.getElementById("quiz-content").innerHTML = `<p>Failed to process your answers. Please try again.</p>`;
    }
}

// Event Listeners
document.querySelector(".chat-window .input-area button").addEventListener("click", sendMessage);
document.querySelector(".chat-window input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});
