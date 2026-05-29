let questions = [];
let currentQuestion = 0;
let userAnswers = [];
let markedQuestions = [];
let timeLeft = 1800;
let timerInterval;
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyYWApnsVJQonaWhh6oHRbIwK4vYC4Hbi862V3irnUaZ-dqFAexl9nvZ_Twp6GIm9ZF5Q/exec";
let questionTimes = [];
let questionStartTime = Date.now();

/* LANDING PAGE QUIZ SELECTION */
function selectQuiz(quizPath, quizName) {

    localStorage.clear();

    localStorage.setItem(
        "selectedQuiz",
        quizPath
    );

    localStorage.setItem(
        "quizName",
        quizName
    );

    window.location.href =
        "login.html";
}

function viewQuestions(filePath) {
    localStorage.setItem("questionFile", filePath);
    window.location.href = "allquestions.html";
}

/* LOGIN */
function startTest() {

    const studentName =
        document.getElementById("studentName")
        ?.value.trim();

    const studentEmail =
        document.getElementById("studentEmail")
        ?.value.trim();

    if (!studentName) {
        alert("Please enter your full name");
        return;
    }

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(studentEmail)) {
        alert("Please enter a valid email address");
        return;
    }

    const selectedQuiz =
        localStorage.getItem("selectedQuiz");

    if (!selectedQuiz) {
        alert("Please select a quiz first.");
        window.location.href = "index.html";
        return;
    }

    localStorage.setItem(
        "studentName",
        studentName
    );

    localStorage.setItem(
        "studentEmail",
        studentEmail
    );

    window.location.href = "test.html";
}

/* TEST INIT */
if (window.location.pathname.includes("test.html")) {
    initializeTest();
}

async function initializeTest() {
    const studentName = localStorage.getItem("studentName");
    const selectedQuiz = localStorage.getItem("selectedQuiz");

    

    if (!studentName || !selectedQuiz) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("welcomeText").textContent =
        `Welcome, ${studentName}`;

    try {
        if (localStorage.getItem("questionsData")) {
            questions = JSON.parse(localStorage.getItem("questionsData"));
        } else {
            const response = await fetch(selectedQuiz);
            questions = await response.json();

            questions = shuffleArray(questions);

            const testQuestionCount = Math.min(30, questions.length);
            questions = questions.slice(0, testQuestionCount);

            localStorage.setItem("questionsData", JSON.stringify(questions));
        }

        userAnswers =
            JSON.parse(localStorage.getItem("userAnswers")) ||
            new Array(questions.length).fill(null);

        markedQuestions =
            JSON.parse(localStorage.getItem("markedQuestions")) ||
            new Array(questions.length).fill(false);

        questionTimes =
            JSON.parse(localStorage.getItem("questionTimes")) ||
            new Array(questions.length).fill(0);

        questionStartTime = Date.now();

        timeLeft = parseInt(localStorage.getItem("timeLeft")) || 1800;
        currentQuestion = parseInt(localStorage.getItem("currentQuestion")) || 0;

        renderQuestion();
        updateStats();
        updatePalette();
        startTimer();

    } catch (error) {
        alert("Failed to load quiz.");
        window.location.href = "index.html";
    }
}

/* SHUFFLE */
function shuffleArray(array) {
    const copied = [...array];

    for (let i = copied.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copied[i], copied[j]] = [copied[j], copied[i]];
    }

    return copied;
}

/* SAVE */
function saveProgress() {
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
    localStorage.setItem("markedQuestions", JSON.stringify(markedQuestions));
    localStorage.setItem("timeLeft", timeLeft);
    localStorage.setItem("currentQuestion", currentQuestion);

    localStorage.setItem(
    "questionTimes",
    JSON.stringify(questionTimes)
    );
}

/* RENDER */
function renderQuestion() {
    if (!questions.length) return;

    const q = questions[currentQuestion];

    document.getElementById("questionText").textContent =
        `Q${currentQuestion + 1}. ${q.question}`;

    const optionsContainer = document.getElementById("optionsContainer");
    optionsContainer.innerHTML = "";

    q.options.forEach((option, index) => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.classList.add("option-btn");

        if (userAnswers[currentQuestion] === index) {
            btn.classList.add("selected");
        }

        btn.onclick = () => {
            userAnswers[currentQuestion] = index;
            saveProgress();
            renderQuestion();
        };

        optionsContainer.appendChild(btn);
    });

    updateProgress();
    updateStats();
    updatePalette();
}

/* NAVIGATION */
function nextQuestion() {

    saveCurrentQuestionTime();

    if (currentQuestion < questions.length - 1) {

        currentQuestion++;

        saveProgress();

        renderQuestion();
    }
}

function prevQuestion() {

    saveCurrentQuestionTime();

    if (currentQuestion > 0) {

        currentQuestion--;

        saveProgress();

        renderQuestion();
    }
}

/* MARK REVIEW */
function markForReview() {
    markedQuestions[currentQuestion] = !markedQuestions[currentQuestion];
    saveProgress();
    updateStats();
    updatePalette();
}

/* PALETTE */
function updatePalette() {
    const palette = document.getElementById("questionPalette");

    if (!palette) return;

    palette.innerHTML = "";

    questions.forEach((_, index) => {
        const btn = document.createElement("button");
        btn.textContent = index + 1;
        btn.classList.add("palette-btn");

        if (index === currentQuestion) {
            btn.classList.add("current");
        }

        if (markedQuestions[index]) {
            btn.classList.add("marked");
        } else if (userAnswers[index] !== null) {
            btn.classList.add("answered");
        }

       btn.onclick = () => {

    saveCurrentQuestionTime();

    currentQuestion = index;

    saveProgress();

    renderQuestion();
};

        palette.appendChild(btn);
    });
}

/* PROGRESS */
function updateProgress() {
    const answered = userAnswers.filter(ans => ans !== null).length;
    const progress = (answered / questions.length) * 100;

    document.getElementById("progressBar").style.width = `${progress}%`;
}

/* STATS */
function updateStats() {
    document.getElementById("answeredCount").textContent =
        userAnswers.filter(ans => ans !== null).length;

    document.getElementById("notAnsweredCount").textContent =
        questions.length - userAnswers.filter(ans => ans !== null).length;

    document.getElementById("markedCount").textContent =
        markedQuestions.filter(mark => mark).length;

    document.getElementById("totalCount").textContent =
        questions.length;
}

/* TIMER */
function startTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        document.getElementById("timer").textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        timeLeft--;
        saveProgress();

        if (timeLeft < 0) {
            clearInterval(timerInterval);
            submitTest(false);
        }
    }, 1000);
}

/* SUBMIT */
function submitTest(showConfirm = true) {

    if (showConfirm) {
        const confirmSubmit =
            confirm("Are you sure you want to submit?");

        if (!confirmSubmit) return;
    }

    clearInterval(timerInterval);

    saveCurrentQuestionTime();
    document.getElementById("loadingScreen").style.display = "flex";
    localStorage.setItem(
        "questionTimes",
        JSON.stringify(questionTimes)
    );

    let score = 0;

    questions.forEach((q, index) => {
        if (userAnswers[index] === q.answer) {
            score++;
        }
    });

    localStorage.setItem("score", score);
    localStorage.setItem("totalQuestions", questions.length);
    localStorage.setItem("questionsData", JSON.stringify(questions));
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));

    const studentName =
        localStorage.getItem("studentName");

    const studentEmail =
        localStorage.getItem("studentEmail");

    const quizName = localStorage.getItem("quizName");

    console.log("Name:", studentName);
    console.log("Email:", studentEmail);
    console.log("Score:", score);

    const formData = new FormData();

formData.append("name", studentName);
formData.append("email", studentEmail);
formData.append("quiz", quizName);
formData.append("score", score);
formData.append("total", questions.length);
formData.append("time", 1800 - timeLeft);

fetch(SHEET_URL, {
    method: "POST",
    body: formData
})
.then(() => {
    window.location.href = "result.html";
});
}
function saveCurrentQuestionTime() {

    const spent = Math.floor(
        (Date.now() - questionStartTime) / 1000
    );

    questionTimes[currentQuestion] =
        (questionTimes[currentQuestion] || 0) + spent;

    questionStartTime = Date.now();

    saveProgress();
}