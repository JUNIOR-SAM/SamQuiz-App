import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// 1. FIREBASE CONFIG & AUTH
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

// Default profile image path
const DEFAULT_PHOTO_PATH = './images/default-profile.png';
let fastLoadIntervalId = null;
let defaultPhotoSet = false;

// DOM Elements
const userNameElement = document.getElementById('dashboardUserName');
const userPhotoElement = document.getElementById('dashboardProfilePic');
const userPhotoMobile = document.getElementById('profilePicMobile'); // 👈 Added for mobile
const logoutBtn = document.getElementById('logoutBtn');

// 🕐 Greeting Helper
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

const updateGreeting = (name) => {
    const greeting = getGreeting();
    const finalName = name || "Guest";

    if (userNameElement) {
        userNameElement.innerHTML = `${greeting}, <span style="font-weight:bold;">${finalName}</span>!`;
    }
};

// ⚡ FAST LOAD (for better UX)
fastLoadIntervalId = setInterval(() => {
    const storedName = localStorage.getItem("userName");
    const storedPhoto = localStorage.getItem("userPhoto");

    updateGreeting(storedName);

    if (storedPhoto && storedPhoto.length > 0 && storedPhoto !== DEFAULT_PHOTO_PATH) {
        if (userPhotoElement) userPhotoElement.src = storedPhoto;
        if (userPhotoMobile) userPhotoMobile.src = storedPhoto;
        clearInterval(fastLoadIntervalId);
    }

    if ((!storedPhoto || storedPhoto.length === 0) && !defaultPhotoSet) {
        if (userPhotoElement) userPhotoElement.src = DEFAULT_PHOTO_PATH;
        if (userPhotoMobile) userPhotoMobile.src = DEFAULT_PHOTO_PATH;
        defaultPhotoSet = true;
    }
}, 500);

// 🔁 AUTH STATE HANDLER
onAuthStateChanged(auth, (user) => {
    if (fastLoadIntervalId) clearInterval(fastLoadIntervalId);

    if (user) {
        // Handle display name logic for all providers (email, Google, GitHub, Twitter)
        const storedName = localStorage.getItem("userName");
        const firebaseDisplayName = user.displayName || user.email?.split('@')[0] || 'User';
        let finalDisplayName = storedName || firebaseDisplayName;
        let photoURL = user.photoURL || DEFAULT_PHOTO_PATH;

        // 👇 Optional: detect Twitter profile info if available
        if (user.reloadUserInfo && user.reloadUserInfo.providerUserInfo) {
            const twitterInfo = user.reloadUserInfo.providerUserInfo.find(p => p.providerId === 'twitter.com');
            if (twitterInfo) {
                if (twitterInfo.displayName) finalDisplayName = twitterInfo.displayName;
                if (twitterInfo.photoUrl) photoURL = twitterInfo.photoUrl;
            }
        }

        // Save final user info locally
        localStorage.setItem("userName", finalDisplayName);
        localStorage.setItem("userPhoto", photoURL);

        // Update UI for both desktop and mobile
        updateGreeting(finalDisplayName);
        if (userPhotoElement) userPhotoElement.src = photoURL;
        if (userPhotoMobile) userPhotoMobile.src = photoURL;

    } else {
        localStorage.clear();
        sessionStorage.clear();
        // Redirect to sign-in page if logged out
        // window.location.href = "signin.html";
    }
});

// 🧾 LOGOUT FUNCTION
const logoutDesktop = document.getElementById('logout');
const logoutMobile = document.getElementById('logoutMobile');

function logOut() {
    signOut(auth)
        .then(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "signin.html";
        })
        .catch((error) => console.error("Logout failed:", error));
}

if (logoutDesktop) logoutDesktop.addEventListener("click", logOut);
if (logoutMobile) logoutMobile.addEventListener("click", logOut);


window.logOut = logOut;

// 2. THEME TOGGLE

const themeToggleBtns = document.querySelectorAll("#themeToggleMobile, #themeToggleDesktop");

// Function to toggle dark mode
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");

  // Update icons and colors
  themeToggleBtns.forEach(btn => {
    btn.textContent = isDark ? "☀️" : "🌙";
    btn.style.backgroundColor = isDark ? "#ffb703" : "#e3e3e3"; // gold in dark mode, light grey in light mode
    btn.style.color = isDark ? "#000" : "#000"; // keep readable
  });

  // Save the theme
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Attach click event to all buttons
themeToggleBtns.forEach(btn => btn.addEventListener("click", toggleTheme));

// Apply saved theme on load
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggleBtns.forEach(btn => {
      btn.textContent = "☀️";
      btn.style.backgroundColor = "#ffb703";
      btn.style.color = "#000";
    });
  } else {
    themeToggleBtns.forEach(btn => {
      btn.textContent = "🌙";
      btn.style.backgroundColor = "#e3e3e3";
      btn.style.color = "#000";
    });
  }
});



// ======================================================================
// 3. QUIZ CORE LOGIC
// ======================================================================

const QUIZ_API_URL = "https://opentdb.com/api.php";

// Global Quiz State
let questionsData = [];
let currentQuestionIndex = 0;
let timerInterval;
let totalTime;

// DOM Elements for Quiz
const quizContainer = document.getElementById("quizContainer");
const quizForm = document.getElementById("quizForm");
const submitBtn = document.getElementById("submitQuizBtn");
const resultsContainer = document.getElementById("resultsContainer");
const progressBar = document.getElementById("progressBar");
const timerDisplay = document.getElementById("timerDisplay");
const quizNavigation = document.getElementById("quizNavigation");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");


// --- Utility Functions ---

// Safely decode HTML entities from API response
const safeDecode = (str) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
};

// --- Timer & Progress ---

const startTimer = (totalQuestions, secondsPerQuestion = 30) => {
    totalTime = totalQuestions * secondsPerQuestion;
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;

        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }

        if (totalTime <= 0) {
            clearInterval(timerInterval);
            if (timerDisplay) timerDisplay.textContent = "⏰ Time's up!";
            handleSubmit(new Event("submit"));
        }

        totalTime--;
    }, 1000);
};

const updateProgress = (current, total) => {
    if (!progressBar) return;
    const percent = Math.floor((current / total) * 100);
    progressBar.style.width = percent + "%";
    progressBar.setAttribute("aria-valuenow", percent);
    progressBar.textContent = percent + "%";
};

const updateProgressBarIfAnswered = () => {
    const answeredCount = questionsData.filter((q) => q.user_answer !== null).length;
    updateProgress(answeredCount, questionsData.length);
};

// --- Answer Handling ---

const saveUserAnswer = () => {
    const selectedAnswerElement = quizForm.querySelector('input[name="currentQuestion"]:checked');
    if (selectedAnswerElement) {
        questionsData[currentQuestionIndex].user_answer = selectedAnswerElement.value;
    } else {
        questionsData[currentQuestionIndex].user_answer = null;
    }
};

const loadUserAnswer = () => {
    // 1. Clear previous selection highlights
    document.querySelectorAll('.answers label').forEach(label => {
        label.classList.remove('selected-option');
    });

    const savedAnswerValue = questionsData[currentQuestionIndex].user_answer;
    
    if (savedAnswerValue) {
        // Find the radio button corresponding to the saved (encoded) answer value
        const element = quizForm.querySelector(`input[name="currentQuestion"][value="${savedAnswerValue}"]`);
        
        if (element) {
            element.checked = true;
            // 2. Apply highlight to the reloaded selected answer's label
            element.parentElement.classList.add('selected-option');
        }
    }
};


// --- UI Rendering ---

const attachAnswerListeners = () => {
    // Listener for highlighting selected option and saving the answer
    quizForm.querySelectorAll('input[name="currentQuestion"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // Remove highlight from all labels
            document.querySelectorAll('.answers label').forEach(label => {
                label.classList.remove('selected-option');
            });

            // Add highlight to the selected label (parent of the radio)
            this.parentElement.classList.add('selected-option');
            
            // Save answer and update progress immediately on change
            saveUserAnswer();
            updateProgressBarIfAnswered();
        });
    });
};

const displayQuestion = () => {
    const q = questionsData[currentQuestionIndex];
    if (!q) return;

    // Decode question and answers for display
    const decodedQuestion = safeDecode(q.question);
    const correctAnswer = safeDecode(q.correct_answer);
    const incorrectAnswers = q.incorrect_answers.map(safeDecode);
    
    // Combine and shuffle answers
    const allAnswers = [...incorrectAnswers, correctAnswer];
    allAnswers.sort(() => Math.random() - 0.5);

    let answersHtml = allAnswers
        .map(
            (answer) => `
        <label>
            <input class="mt-3"
                type="radio"
                name="currentQuestion"
                value="${encodeURIComponent(answer)}">
            ${answer}
        </label><br>`
        )
        .join("");

    let html = `
        <div class="question-block">
            <h5 style="color:white;">Q${currentQuestionIndex + 1} of ${questionsData.length}: ${decodedQuestion}</h5>
            <div class="answers">${answersHtml}</div>
        </div>
    `;

    quizContainer.innerHTML = html;

    // Attach listeners and load state
    attachAnswerListeners();
    loadUserAnswer();

    // Navigation Button Control
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === questionsData.length - 1) {
        // Last question: Hide Next, Show Submit
        if (nextBtn) nextBtn.style.display = "none";
        submitBtn.style.display = "block";
    } else {
        // Not last question: Show Next, Hide Submit
        if (nextBtn) nextBtn.style.display = "inline-block";
        submitBtn.style.display = "none";
    }
};

const renderQuiz = () => {
    if (questionsData.length === 0) {
        quizContainer.innerHTML = "No questions available.";
        return;
    }

    currentQuestionIndex = 0;
    
    // CRITICAL: Remove d-none class to display navigation
    if(quizNavigation) quizNavigation.classList.remove("d-none");
    if(submitBtn) submitBtn.style.display = "none";
    
    quizForm.onsubmit = handleSubmit;

    displayQuestion();
};

// --- Navigation ---

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


const generateQuiz = async () => {
    const categoryId = document.getElementById("subjectSelect")?.value;
    const amount = parseInt(document.getElementById("numQuestions")?.value || 0);
    const difficulty = document.getElementById("difficultySelect")?.value;

    if (amount < 1 || amount > 50) {
        // Using console.error instead of alert as per guidelines
        console.error("Validation Error: Please select between 1 and 50 questions.");
        quizContainer.innerHTML = "<p style='color:red;'>Please select between 1 and 50 questions.</p>";
        return;
    }

    let url = `${QUIZ_API_URL}?amount=${amount}&category=${categoryId}&type=multiple`;
    if (difficulty) url += `&difficulty=${difficulty}`;

    quizContainer.innerHTML = "Loading questions...";
    resultsContainer.style.display = "none";
    
    // CRITICAL: Add d-none class to ensure navigation is hidden while loading
    if(quizNavigation) quizNavigation.classList.add("d-none"); 
    if(submitBtn) submitBtn.style.display = "none";
    
    questionsData = [];

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            questionsData = data.results;
            questionsData.forEach((q) => (q.user_answer = null));

            startTimer(amount, 30); 
            updateProgress(0, amount);
            renderQuiz();
        } else {
            quizContainer.innerHTML = "Could not fetch questions. Try again or change criteria.";
        }
    } catch (error) {
        console.error("Error fetching quiz:", error);
        quizContainer.innerHTML = "An error occurred while fetching the quiz.";
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
    const totalQuestions = questionsData.length;

    questionsData.forEach((q, index) => {
        // Decode selected answer and correct answer for display
        const selectedAnswerEncoded = q.user_answer;
        const selectedAnswer = selectedAnswerEncoded 
            ? safeDecode(decodeURIComponent(selectedAnswerEncoded)) 
            : "No Answer Selected";

        const correctAnswer = safeDecode(q.correct_answer);
        let isCorrect = selectedAnswer === correctAnswer;

        if (isCorrect) score++;

        detailedResultsHtml += `
            <div style="margin-bottom: 10px; padding: 10px; border: 3px solid ${isCorrect ? "green" : "rgb(253, 114, 0)"};" class="rounded-3 col-11 col-lg-5 mx-lg-auto ms-2">
                <p><strong>Q${index + 1}:</strong> ${safeDecode(q.question)}</p>
                <p style="color: ${isCorrect ? "green" : "red"};font-weight:bold;">Your Answer: ${selectedAnswer}</p>
                ${!isCorrect
                ? `<p style="color: green; font-weight:bold;">Correct Answer: ${correctAnswer}</p>`
                : ""
            }
            </div>
        `;
    });

    if (scoreElement) {
        scoreElement.textContent = `You scored ${score} out of ${totalQuestions} (${(
            (score / totalQuestions) * 100
        ).toFixed(2)}%)`;
    }
    if (detailedResults) {
        detailedResults.innerHTML = detailedResultsHtml;
    }

    // Hide Quiz/Show Results
    if (resultsContainer) resultsContainer.style.display = "block";
    if (quizContainer) quizContainer.innerHTML = "";
    if (submitBtn) submitBtn.style.display = "none";
    
    // CRITICAL FIX: Ensure navigation is hidden after submission
    if (quizNavigation) quizNavigation.classList.add("d-none"); 

    // Reset UI elements
    updateProgress(0, 1);
    if (timerDisplay) timerDisplay.textContent = "00:00";
};

const takeNewQuiz = () => {
    if (resultsContainer) resultsContainer.style.display = "none";
    if (quizContainer) quizContainer.innerHTML = '<p class="text-white">Select your subject and then click on "Generate Quiz"</p>';
};

// 4. EXPOSE FUNCTIONS GLOBALLY

window.generateQuiz = generateQuiz;
window.takeNewQuiz = takeNewQuiz;
window.showNextQuestion = showNextQuestion;
window.showPreviousQuestion = showPreviousQuestion;
