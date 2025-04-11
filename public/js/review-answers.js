// Review Answers JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // ==================  Set up variables  ========= ///
  let qNumber = null;
  let quizData, quizQuestions, question, userQuizInfo;

  // Get DOM elements first to avoid reference errors
  const nextButton = document.getElementById('next');
  const prevButton = document.getElementById('prev');
  const questionSec = document.getElementById('questionSec');
  const questionGrid = document.getElementById('questionGrid');

  // Initialize quiz data from server-rendered variables
  try {
    quizData = JSON.parse(document.getElementById('quizData').textContent);
    quizQuestions = JSON.parse(
      document.getElementById('quizQuestions').textContent
    );
    question = JSON.parse(
      document.getElementById('currentQuestion').textContent
    );
    userQuizInfo = JSON.parse(
      document.getElementById('userQuizInfo').textContent
    );
  } catch (error) {
    console.error('Error initializing quiz data:', error);
  }

  // Check if the question and qNumber exist
  if (question && question.qNumber) {
    qNumber = +question.qNumber;
  }

  // Update UI based on current question
  updateQuestionUI();
  updateStatsUI();
  updateNavigationUI();

  // ==================  Question Navigation  ============== //
  // Next Button Handler
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      navigateToQuestion(qNumber + 1);
    });
  }

  // Previous Button Handler
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      navigateToQuestion(qNumber - 1);
    });
  }

  // Direct Question Navigation
  window.goToQuestion = (questionNumber) => {
    navigateToQuestion(questionNumber);
  };

  function navigateToQuestion(questionNumber) {
    if (
      !quizData ||
      questionNumber < 1 ||
      questionNumber > quizData.sampleQuestions
    ) {
      return;
    }

    // Show loading spinner
    if (questionSec) {
      questionSec.innerHTML = `<div class="spinner"></div>`;
    }

    // Navigate to the question
    window.location.href = `/student/reviewAnswers/${quizData._id}?qNumber=${questionNumber}`;
  }

  // ==================  Helper Functions  ============== //
  function updateQuestionUI() {
    if (!question || !questionSec || !userQuizInfo || !userQuizInfo.answers)
      return;

    // Update question in progress display
    const questionInProgress = document.getElementById('QuestionInProgress');
    if (questionInProgress) {
      questionInProgress.textContent = qNumber || 0;
    }

    const userAnswer = userQuizInfo.answers[qNumber];
    const correctAnswer = question.ranswer;

    // Build question HTML
    let questionHTML = '';

    if (question.questionPhoto && question.questionPhoto !== '') {
      questionHTML += `
        <div class="box-img">
          <img src="${question.questionPhoto}" alt="Question Image">
        </div>
      `;
    }

    questionHTML += `<h1 class="question-title">${question.title}</h1>`;

    // Add answer options with enhanced status indicators
    for (let i = 1; i <= 4; i++) {
      const isUserAnswer = userAnswer == i;
      const isCorrectAnswer = correctAnswer == i;

      let labelClass = '';
      let statusIcon = '';

      if (isUserAnswer && isCorrectAnswer) {
        // User selected the correct answer
        labelClass = 'correct-answer';
        statusIcon = `<span class="answer-status correct-indicator"><i class="fas fa-check-circle"></i></span>`;
      } else if (isUserAnswer && !isCorrectAnswer) {
        // User selected the wrong answer
        labelClass = 'incorrect-answer';
        statusIcon = `<span class="answer-status incorrect-indicator"><i class="fas fa-times-circle"></i></span>`;
      } else if (!isUserAnswer && isCorrectAnswer) {
        // Correct answer that user didn't select
        labelClass = 'correct-but-not-selected';
        statusIcon = `<span class="answer-status correct-indicator"><i class="fas fa-check-circle"></i></span>`;
      }

      questionHTML += `
        <div class="answer-option">
          <input type="radio" name="answer" id="answer${i}" value="${i}" ${
        isUserAnswer ? 'checked' : ''
      } disabled>
          <label for="answer${i}" class="${labelClass}">
            ${question['answer' + i]}
            ${statusIcon}
          </label>
        </div>
      `;
    }

    questionSec.innerHTML = questionHTML;
  }

  function updateNavigationUI() {
    // Update next/prev button visibility
    if (qNumber === quizData.sampleQuestions && nextButton) {
      nextButton.style.display = 'none';
    } else if (qNumber === 1 && prevButton) {
      prevButton.style.display = 'none';
    }
  }

  function updateStatsUI() {
    if (!quizQuestions || !userQuizInfo || !userQuizInfo.answers) return;

    // Count correct, incorrect, and unattempted questions
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    quizQuestions.forEach((question, index) => {
      const questionNumber = index + 1;
      const userAnswer = userQuizInfo.answers[questionNumber];

      if (!userAnswer) {
        unattemptedCount++;
      } else if (userAnswer == question.ranswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    // Update stats in the panel
    const correctCountElement = document.getElementById('correctCount');
    const incorrectCountElement = document.getElementById('incorrectCount');
    const unattemptedCountElement = document.getElementById('unattemptedCount');

    if (correctCountElement) correctCountElement.textContent = correctCount;
    if (incorrectCountElement)
      incorrectCountElement.textContent = incorrectCount;
    if (unattemptedCountElement)
      unattemptedCountElement.textContent = unattemptedCount;

    // Update question grid
    if (!questionGrid) return;

    const questionButtons = questionGrid.querySelectorAll('.question-number');
    questionButtons.forEach((button) => {
      const questionNum = Number.parseInt(button.dataset.question);
      const userAnswer = userQuizInfo.answers[questionNum];
      const correctAnswer = quizQuestions[questionNum - 1].ranswer;

      // Reset classes
      button.className = 'question-number';

      // Add appropriate classes
      if (questionNum === qNumber) {
        button.classList.add('current');
      }

      if (!userAnswer) {
        button.classList.add('unattempted');
      } else if (userAnswer == correctAnswer) {
        button.classList.add('correct');
      } else {
        button.classList.add('incorrect');
      }
    });
  }
});
