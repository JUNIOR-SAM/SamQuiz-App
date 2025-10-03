// quiz.js

// ----------------------------------------------------------------------
// 1. GLOBAL VARIABLES & DASHBOARD LOADING (Keep this at the very top)
// ----------------------------------------------------------------------




let questionsData = []; // Global array to store fetched questions
const QUIZ_API_URL = "https://opentdb.com/api.php"; 

// Ensure these elements exist in your HTML
const quizContainer = document.getElementById('quizContainer');
const quizForm = document.getElementById('quizForm');
const submitBtn = document.getElementById('submitQuizBtn');
const resultsContainer = document.getElementById('resultsContainer');

let currentQuestionIndex = 0; 


// ----------------------------------------------------------------------
// 2. QUIZ CORE LOGIC FUNCTIONS
// ----------------------------------------------------------------------

const generateQuiz = async () => {
    // 1. Get user input
    const categoryId = document.getElementById('subjectSelect')?.value;
    const amount = document.getElementById('numQuestions')?.value;
    const difficulty = document.getElementById('difficultySelect')?.value;

    if (amount < 1 || amount > 50) {
        alert("Please select between 1 and 50 questions.");
        return;
    }

    // 2. Construct API URL
    let url = `${QUIZ_API_URL}?amount=${amount}&category=${categoryId}&type=multiple`;
    if (difficulty) {
        url += `&difficulty=${difficulty}`;
    }
    
    // Clear previous content
    quizContainer.innerHTML = 'Loading questions...';
    resultsContainer.style.display = 'none';
    submitBtn.style.display = 'none';
    questionsData = [];

    try {
        // 3. Fetch data
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            questionsData = data.results;
            // Initialize user_answer property for each question
            questionsData.forEach(q => q.user_answer = null); 
            renderQuiz(); 
        } else {
            quizContainer.innerHTML = 'Could not fetch questions. Try a different category/number/difficulty.';
        }
    } catch (error) {
        console.error("Error fetching quiz:", error);
        quizContainer.innerHTML = 'An error occurred while fetching the quiz.';
    }
};


const renderQuiz = () => {
    if (questionsData.length === 0) {
        quizContainer.innerHTML = 'No questions available.';
        return;
    }
    
    currentQuestionIndex = 0;
    // Ensure 'quizNavigation' element exists in your HTML
    document.getElementById('quizNavigation').style.display = 'block'; 
    submitBtn.style.display = 'none';

    displayQuestion(); 
    quizForm.onsubmit = handleSubmit;
};


const displayQuestion = () => {
    const q = questionsData[currentQuestionIndex];
    if (!q) return;

    // 1. Prepare Answers HTML
    const allAnswers = [...q.incorrect_answers, q.correct_answer];
    // Shuffle the answers array every time the question is displayed
    allAnswers.sort(() => Math.random() - 0.5); 

    let answersHtml = allAnswers.map(answer => `
        <label>
            <input 
                type="radio" 
                name="currentQuestion" 
                value="${encodeURIComponent(answer)}" 
                onchange="saveUserAnswer()"
            >
            ${decodeURIComponent(answer)}
        </label><br>
    `).join('');

    let html = `
        <div class="question-block">
            <h3>Q${currentQuestionIndex + 1} of ${questionsData.length}: ${q.question}</h3>
            <div class="answers">
                ${answersHtml}
            </div>
        </div>
    `;

    quizContainer.innerHTML = html;

    // 2. Load the previously saved answer
    loadUserAnswer();
    
    // 3. Control Navigation & Submit Button visibility
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === questionsData.length - 1) {
        if (nextBtn) nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        if (nextBtn) nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
};


const saveUserAnswer = () => {
    const selectedAnswerElement = quizForm.querySelector('input[name="currentQuestion"]:checked');
    if (selectedAnswerElement) {
        questionsData[currentQuestionIndex].user_answer = selectedAnswerElement.value;
    } else {
        questionsData[currentQuestionIndex].user_answer = null;
    }
};


const loadUserAnswer = () => {
    const savedAnswerValue = questionsData[currentQuestionIndex].user_answer;
    if (savedAnswerValue) {
        const element = quizForm.querySelector(`input[name="currentQuestion"][value="${savedAnswerValue}"]`);
        if (element) {
            element.checked = true;
        }
    }
};


const showNextQuestion = () => {
    // Save current answer before moving
    saveUserAnswer(); 
    
    if (currentQuestionIndex < questionsData.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
};

const showPreviousQuestion = () => {
    // Save current answer before moving
    saveUserAnswer(); 
    
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
};


// ----------------------------------------------------------------------
// 3. SUBMISSION AND RESULTS LOGIC
// ----------------------------------------------------------------------
const handleSubmit = (event) => {
    event.preventDefault();
    
    // Save the answer for the last question viewed before scoring
    saveUserAnswer(); 

    let score = 0;
    let detailedResultsHtml = '';
    const scoreElement = document.getElementById('score'); // Must be defined here
    const detailedResults = document.getElementById('detailedResults'); // Must be defined here

    questionsData.forEach((q, index) => {
        const selectedAnswer = q.user_answer 
            ? decodeURIComponent(q.user_answer) 
            : 'No Answer Selected';
        
        const correctAnswer = q.correct_answer;
        let isCorrect = selectedAnswer === correctAnswer;
        
        if (isCorrect) score++;
    
        detailedResultsHtml += `
            <div style="margin-bottom: 10px; padding: 5px; border: 1px solid ${isCorrect ? 'green' : 'black'};">
                <p><strong>Q${index + 1}:</strong> ${decodeURIComponent(q.question)}</p>
                <p style="color: ${isCorrect ? 'green' : 'red'};">Your Answer: ${selectedAnswer}</p>
                ${!isCorrect ? `<p style="color: blue;">Correct Answer: ${correctAnswer}</p>` : ''}
            </div>
        `;
    });

    // *** FIX: Display final score and results ***
    const totalQuestions = questionsData.length;
    if (scoreElement) {
        scoreElement.textContent = `You scored ${score} out of ${totalQuestions} (${(score / totalQuestions * 100).toFixed(2)}%)`;
    }
    if (detailedResults) {
        detailedResults.innerHTML = detailedResultsHtml;
    }

    if (resultsContainer) resultsContainer.style.display = 'block';
    if (quizContainer) quizContainer.innerHTML = '';
    if (submitBtn) submitBtn.style.display = 'none';
    
    // Hide navigation buttons after submission
    const navDiv = document.getElementById('quizNavigation');
    if (navDiv) navDiv.style.display = 'none';
};


const takeNewQuiz = () => {
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (quizContainer) quizContainer.innerHTML = '<p>Click "Generate Quiz" to begin!</p>';
};


// ----------------------------------------------------------------------
// 4. EXPOSE FUNCTIONS GLOBALLY (Fixes ReferenceErrors)
// ----------------------------------------------------------------------

window.generateQuiz = generateQuiz;
window.takeNewQuiz = takeNewQuiz;
window.showNextQuestion = showNextQuestion;
window.showPreviousQuestion = showPreviousQuestion;
window.saveUserAnswer = saveUserAnswer;
