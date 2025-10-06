
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC5i2mQIBEusJq4J6yK2kGap1kA5gwzMTA",
    authDomain: "quiz-generator-9fe13.firebaseapp.com",
    projectId: "quiz-generator-9fe13",
    storageBucket: "quiz-generator-9fe13.firebasestorage.app",
    messagingSenderId: "667965575098",
    appId: "1:667965575098:web:7b554501bc04daab769783"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const userNameElement = document.getElementById('dashboardUserName');
const userPhotoElement = document.getElementById('dashboardProfilePic');
const logoutBtn = document.getElementById('logoutBtn');

// ----------------------------------------------------------------------
// GREETING FUNCTIONS (Correctly ordered for no ReferenceError)
// ----------------------------------------------------------------------

// 1. Define getGreeting first
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}

// 2. Define updateGreeting second (it uses getGreeting)
function updateGreeting(name) {
    const greeting = getGreeting(); 
    // Use the stored name, or fallback to 'Guest'
    const finalName = name || "Guest"; 
    
    if (userNameElement) {
        userNameElement.innerHTML = 
            `${greeting}, <span style="font-weight:bold;">${finalName}</span>!`;
    }
}

// Global variable to hold the interval ID
let fastLoadIntervalId = null;
// Flag to ensure the default image is set only once to prevent looping 404 errors
let defaultPhotoSet = false; 

// --- CRITICAL PATH CHANGE ---
// Use a slightly more robust path for the default image.
const DEFAULT_PHOTO_PATH = './images/default-profile.png'; 

// ----------------------------------------------------------------------
// 1. INITIAL LOAD & FAST PROFILE DISPLAY
// ----------------------------------------------------------------------

// Use setInterval to quickly load the stored photo/name from localStorage.
fastLoadIntervalId = setInterval(() => {
    const storedName = localStorage.getItem("userName");
    const storedPhoto = localStorage.getItem("userPhoto");
    
    updateGreeting(storedName);
    
    // Display stored photo URL if available and not empty
    if (userPhotoElement && storedPhoto && storedPhoto.length > 0) {
        userPhotoElement.src = storedPhoto;
        
        // CRITICAL FIX: If we have a photo that isn't the default path, stop checking.
        if (storedPhoto !== DEFAULT_PHOTO_PATH) {
             clearInterval(fastLoadIntervalId);
        }
    } 
    
    // Set the default image ONCE if the element exists and no photo URL is stored.
    if (userPhotoElement && (!storedPhoto || storedPhoto.length === 0) && !defaultPhotoSet) {
        // NOTE: Ensure 'default-profile.png' is in the correct directory.
        userPhotoElement.src = DEFAULT_PHOTO_PATH; 
        defaultPhotoSet = true;
    }
}, 500); // Check every 0.5 seconds for faster display


// ----------------------------------------------------------------------
// 2. FIREBASE AUTH STATE (Authoritative Check)
// ----------------------------------------------------------------------

// This function runs when the auth state changes (login/logout/page load)
onAuthStateChanged(auth, (user) => {
    // Stop the fast-load interval once Firebase has established the user status
    if (fastLoadIntervalId) {
        clearInterval(fastLoadIntervalId);
    }
    
    if (user) {
        // User is logged in. Use the live data to ensure accuracy.
        
        // --- NAME LOGIC (Prioritizes custom name from localStorage) ---
        const storedName = localStorage.getItem("userName");
        
        // If the signin script successfully updated the Firebase profile, use that,
        // otherwise fall back to email prefix.
        const firebaseDisplayName = user.displayName || user.email?.split('@')[0] || 'User';
        
        // 3. Prioritize: Stored Custom Name > Firebase Display Name > Email Prefix
        const finalDisplayName = storedName || firebaseDisplayName;
        
        // --- PHOTO LOGIC ---
        // 4. Determine Photo URL: Use Firebase photoURL (if valid), otherwise use the default path.
        const photoURL = user.photoURL && user.photoURL.length > 0 ? user.photoURL : DEFAULT_PHOTO_PATH; 

        // 5. CRITICAL: Save the authoritative data back to localStorage for consistency
        localStorage.setItem("userName", finalDisplayName);
        localStorage.setItem("userPhoto", photoURL);
        
        // 6. Update the DOM elements with the authoritative data
        updateGreeting(finalDisplayName);
        if (userPhotoElement) {
            userPhotoElement.src = photoURL;
        }
        
    } else {
        // No user → clear storage and redirect to sign-in page
        localStorage.clear();
        sessionStorage.clear();
        // window.location.href = "signin.html";
    }
});


// ----------------------------------------------------------------------
// 3. LOGOUT LOGIC
// ----------------------------------------------------------------------

// Logout function
const logOut = () => {
    signOut(auth)
        .then(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "signin.html";
        })
        .catch((error) => {
            console.error("Logout error:", error);
        });
};

// Attach logOut function to the button (if it exists)
if (logoutBtn) {
    logoutBtn.addEventListener("click", logOut);
}

// Expose logOut globally (if needed by HTML structure)
window.logOut = logOut;








// ---------------------------
// Theme Toggle (dark/light)
// ---------------------------
const themeToggleBtns = document.querySelectorAll("#themeToggleMobile, #themeToggleDesktop");

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");

    themeToggleBtns.forEach(btn => {
        btn.textContent = isDark ? "🌞" : "🌙";
    });

    localStorage.setItem("theme", isDark ? "dark" : "light");
}

themeToggleBtns.forEach(btn => btn.addEventListener("click", toggleTheme));

// Load saved theme preference
window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggleBtns.forEach(btn => btn.textContent = "🌞");
    } else {
        themeToggleBtns.forEach(btn => btn.textContent = "🌙");
    }
});










document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            signOut(auth)
                .then(() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = "signin.html"; 
                })
                .catch((error) => {
                    console.error("Logout error:", error);
                    alert("Failed to log out. Please try again.");
                });
        });
    }
});






// 1. GLOBAL VARIABLES

let questionsData = [];
const QUIZ_API_URL = "https://opentdb.com/api.php";

const quizContainer = document.getElementById("quizContainer");
const quizForm = document.getElementById("quizForm");
const submitBtn = document.getElementById("submitQuizBtn");
const resultsContainer = document.getElementById("resultsContainer");
const progressBar = document.getElementById("progressBar");
const timerDisplay = document.getElementById("timerDisplay");

let currentQuestionIndex = 0;
let timerInterval;
let totalTime;

// 2. QUIZ CORE LOGIC FUNCTIONS

const generateQuiz = async () => {
    const categoryId = document.getElementById("subjectSelect")?.value;
    const amount = parseInt(document.getElementById("numQuestions")?.value || 0);
    const difficulty = document.getElementById("difficultySelect")?.value;

    if (amount < 1 || amount > 50) {
        alert("Please select between 1 and 50 questions.");
        return;
    }

    let url = `${QUIZ_API_URL}?amount=${amount}&category=${categoryId}&type=multiple`;
    if (difficulty) url += `&difficulty=${difficulty}`;

    quizContainer.innerHTML = "Loading questions...";
    resultsContainer.style.display = "none";
    submitBtn.style.display = "none";
    questionsData = [];

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            questionsData = data.results;
            questionsData.forEach((q) => (q.user_answer = null));

            // Start Timer
            startTimer(amount, 15);

            // Reset Progress Bar
            updateProgress(0, amount);

            renderQuiz();
        } else {
            quizContainer.innerHTML = "Could not fetch questions. Try again.";
        }
    } catch (error) {
        console.error("Error fetching quiz:", error);
        quizContainer.innerHTML = "An error occurred while fetching the quiz.";
    }
};

const renderQuiz = () => {
    if (questionsData.length === 0) {
        quizContainer.innerHTML = "No questions available.";
        return;
    }

    currentQuestionIndex = 0;
    document.getElementById("quizNavigation").style.display = "block";
    submitBtn.style.display = "none";

    displayQuestion();
    quizForm.onsubmit = handleSubmit;
};

const displayQuestion = () => {
    const q = questionsData[currentQuestionIndex];
    if (!q) return;

    const allAnswers = [...q.incorrect_answers, q.correct_answer];
    allAnswers.sort(() => Math.random() - 0.5);

    let answersHtml = allAnswers
        .map(
            (answer) => `
        <label>
            <input 
                type="radio" 
                name="currentQuestion" 
                value="${encodeURIComponent(answer)}">
            ${decodeURIComponent(answer)}
        </label><br>`
        )
        .join("");

    let html = `
        <div class="question-block">
            <h3>Q${currentQuestionIndex + 1} of ${questionsData.length
        }: ${decodeURIComponent(q.question)}</h3>
            <div class="answers">${answersHtml}</div>
        </div>
    `;

    quizContainer.innerHTML = html;

    loadUserAnswer();

    quizForm
        .querySelectorAll('input[name="currentQuestion"]')
        .forEach((input) => {
            input.addEventListener("change", () => {
                saveUserAnswer();
                updateProgressBarIfAnswered();
            });
        });

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === questionsData.length - 1) {
        if (nextBtn) nextBtn.style.display = "none";
        submitBtn.style.display = "block";
    } else {
        if (nextBtn) nextBtn.style.display = "inline-block";
        submitBtn.style.display = "none";
    }
};

// 3. TIMER + PROGRESS BAR FUNCTIONS

function startTimer(totalQuestions, secondsPerQuestion = 30) {
    totalTime = totalQuestions * secondsPerQuestion;
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;

        if (timerDisplay) {
            timerDisplay.textContent = `${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }

        if (totalTime <= 0) {
            clearInterval(timerInterval);
            if (timerDisplay) timerDisplay.textContent = "⏰ Time's up!";
            handleSubmit(new Event("submit"));
        }

        totalTime--;
    }, 1000);
}

function updateProgress(current, total) {
    if (!progressBar) return;
    const percent = Math.floor((current / total) * 100);
    progressBar.style.width = percent + "%";
    progressBar.setAttribute("aria-valuenow", percent);
    progressBar.textContent = percent + "%";
}

function updateProgressBarIfAnswered() {
    const answeredCount = questionsData.filter((q) => q.user_answer !== null)
        .length;
    updateProgress(answeredCount, questionsData.length);
}

// 4. NAVIGATION + SUBMIT

const saveUserAnswer = () => {
    const selectedAnswerElement = quizForm.querySelector(
        'input[name="currentQuestion"]:checked'
    );
    if (selectedAnswerElement) {
        questionsData[currentQuestionIndex].user_answer =
            selectedAnswerElement.value;
    } else {
        questionsData[currentQuestionIndex].user_answer = null;
    }
};

const loadUserAnswer = () => {
    const savedAnswerValue = questionsData[currentQuestionIndex].user_answer;
    if (savedAnswerValue) {
        const element = quizForm.querySelector(
            `input[name="currentQuestion"][value="${savedAnswerValue}"]`
        );
        if (element) element.checked = true;
    }
};

const showNextQuestion = () => {
    saveUserAnswer();
    if (currentQuestionIndex < questionsData.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
};

const showPreviousQuestion = () => {
    saveUserAnswer();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
};

const handleSubmit = (event) => {
    event.preventDefault();
    saveUserAnswer();
    clearInterval(timerInterval);

    let score = 0;
    let detailedResultsHtml = "";
    const scoreElement = document.getElementById("score");
    const detailedResults = document.getElementById("detailedResults");

    questionsData.forEach((q, index) => {
        const selectedAnswer = q.user_answer
            ? decodeURIComponent(q.user_answer)
            : "No Answer Selected";

        const correctAnswer = decodeURIComponent(q.correct_answer);
        let isCorrect = selectedAnswer === correctAnswer;

        if (isCorrect) score++;

        detailedResultsHtml += `
            <div style="margin-bottom: 10px; padding: 5px; border: 1px solid ${isCorrect ? "green" : "black"
            };">
                <p><strong>Q${index + 1}:</strong> ${decodeURIComponent(
                q.question
            )}</p>
                <p style="color: ${isCorrect ? "green" : "red"};">Your Answer: ${selectedAnswer}</p>
                ${!isCorrect
                ? `<p style="color: blue;">Correct Answer: ${correctAnswer}</p>`
                : ""
            }
            </div>
        `;
    });

    const totalQuestions = questionsData.length;
    if (scoreElement) {
        scoreElement.textContent = `You scored ${score} out of ${totalQuestions} (${(
            (score / totalQuestions) *
            100
        ).toFixed(2)}%)`;
    }
    if (detailedResults) {
        detailedResults.innerHTML = detailedResultsHtml;
    }

    if (resultsContainer) resultsContainer.style.display = "block";
    if (quizContainer) quizContainer.innerHTML = "";
    if (submitBtn) submitBtn.style.display = "none";

    const navDiv = document.getElementById("quizNavigation");
    if (navDiv) navDiv.style.display = "none";

    // Reset Progress Bar
    updateProgress(0, 1);

    // Reset Timer
    if (timerDisplay) timerDisplay.textContent = "00:00";
};

const takeNewQuiz = () => {
    if (resultsContainer) resultsContainer.style.display = "none";
    if (quizContainer)
        quizContainer.innerHTML = '<p>Click "Generate Quiz" to begin!</p>';
};

// 5. EXPOSE FUNCTIONS

window.generateQuiz = generateQuiz;
window.takeNewQuiz = takeNewQuiz;
window.showNextQuestion = showNextQuestion;
window.showPreviousQuestion = showPreviousQuestion;
window.saveUserAnswer = saveUserAnswer;
