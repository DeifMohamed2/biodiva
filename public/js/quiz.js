// Quiz System JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // ==================  Set up variables and local storage  ========= ///
  let answers = [];
  let viewedQuestions = [];
  let qNumber = null;
  let endTime = null;
  let quizData, quizQuestions, question, userQuizInfo;

  // Get DOM elements first to avoid reference errors
  const nextButton = document.getElementById('next');
  const prevButton = document.getElementById('prev');
  const finishButton = document.getElementById('finish');
  const questionSec = document.getElementById('questionSec');

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

    // Set endTime from userQuizInfo
    if (userQuizInfo && userQuizInfo.endTime) {
      endTime = new Date(userQuizInfo.endTime).getTime();


       const currentTime = Date.now();
       if (endTime <= currentTime) {
         // Time already expired, finish the quiz immediately
         document.getElementById('minutes').innerText = '00';
         document.getElementById('seconds').innerText = '00';

         // Add a small delay to ensure the DOM is fully loaded
         setTimeout(() => {
           finish();
         }, 500);
       }
    }
  } catch (error) {
    console.error('Error initializing quiz data:', error);
  }

  // Load answers and viewed questions from localStorage
  try {
    const savedAnswers = localStorage.getItem('quizAnswers_' + quizData._id);
    if (savedAnswers) {
      answers = JSON.parse(savedAnswers);
    }

    const savedViewed = localStorage.getItem('quizViewed_' + quizData._id);
    if (savedViewed) {
      viewedQuestions = JSON.parse(savedViewed);
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }

  // Check if the question and qNumber exist
  if (question && question.qNumber) {
    qNumber = +question.qNumber;

    // Mark current question as viewed
    if (!viewedQuestions.includes(qNumber)) {
      viewedQuestions.push(qNumber);
      localStorage.setItem(
        'quizViewed_' + quizData._id,
        JSON.stringify(viewedQuestions)
      );
    }
  }

  // ==================  Timer  ============== //
  function updateTimer() {
    if (!endTime) {
      console.error('End time not set');
      return;
    }

    // Initial update
    updateTimerDisplay();

    // Set interval for updates
    const timerInterval = setInterval(updateTimerDisplay, 1000);

    function updateTimerDisplay() {
      const now = Date.now();
      const remainingTime = endTime - now;

      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        document.getElementById('minutes').innerText = '00';
        document.getElementById('seconds').innerText = '00';

        // Auto-finish when time is up
        if (finishButton) {
          finish();
        }
        return;
      }

      const minutes = Math.floor(remainingTime / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);

      document.getElementById('minutes').innerText = String(minutes).padStart(
        2,
        '0'
      );
      document.getElementById('seconds').innerText = String(seconds).padStart(
        2,
        '0'
      );

      // Warning colors when time is running out
      const timerElement = document.querySelector('.quiz-timer');
      if (timerElement) {
        if (remainingTime < 60000) {
          // Less than 1 minute
          timerElement.classList.add('time-warning');
        }
        if (remainingTime < 30000) {
          // Less than 30 seconds
          timerElement.classList.add('time-danger');
        }
      }
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(timerInterval);
    });
  }

  // Update UI based on current question
  updateQuestionUI();
  updateStatsUI();
  updateNavigationUI();

  // Start the timer
  updateTimer();

  // ==================  Question Navigation  ============== //
  // Debounced Next Button Handler
  if (nextButton) {
    let nextButtonDisabled = false;
    nextButton.addEventListener('click', () => {
      if (!nextButtonDisabled) {
        nextButtonDisabled = true;
        saveCurrentAnswer();

        setTimeout(() => {
          nextButtonDisabled = false;
          navigateToQuestion(qNumber + 1);
        }, 300);
      }
    });
  }

  // Debounced Previous Button Handler
  if (prevButton) {
    let prevButtonDisabled = false;
    prevButton.addEventListener('click', () => {
      if (!prevButtonDisabled) {
        prevButtonDisabled = true;
        saveCurrentAnswer();

        setTimeout(() => {
          prevButtonDisabled = false;
          navigateToQuestion(qNumber - 1);
        }, 300);
      }
    });
  }

  // Finish Button Handler
  if (finishButton) {
    finishButton.addEventListener('click', () => {
      if (confirm('هل أنت متأكد من إنهاء الامتحان؟')) {
        finishButton.setAttribute('disabled', true);
        saveCurrentAnswer();
        finish();
      }
    });
  }

  // Direct Question Navigation
  window.goToQuestion = (questionNumber) => {
    saveCurrentAnswer();
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
    window.location.href = `/student/quizStart/${quizData._id}?qNumber=${questionNumber}`;
  }

  // ==================  Helper Functions  ============== //
  function saveCurrentAnswer() {
    const selectedOption = document.querySelector(
      'input[name="answer"]:checked'
    );
    if (selectedOption && qNumber) {
      answers[qNumber] = Number(selectedOption.value);
      localStorage.setItem(
        'quizAnswers_' + quizData._id,
        JSON.stringify(answers)
      );

      // Update stats immediately after saving an answer
      updateStatsUI();
    }
  }

  function updateQuestionUI() {
    if (!question || !questionSec) return;

    // Update question in progress display
    const questionInProgress = document.getElementById('QuestionInProgress');
    if (questionInProgress) {
      questionInProgress.textContent = qNumber || 0;
    }

    // Build question HTML
    let questionHTML = '';

    if (question.questionPhoto && question.questionPhoto !== '') {
      questionHTML += `
      <div class="box-img">
        <div class="img-loader">Image Loading...  </div>
        <img src="${question.questionPhoto}" alt="Question Image" style="display: none;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';">
      </div>
      `;
    }

    questionHTML += `<h1 class="question-title">${question.title}</h1>`;

    // Add answer options with improved UI
    for (let i = 1; i <= 4; i++) {
      const isChecked = answers[qNumber] === i ? 'checked' : '';
      questionHTML += `
        <div class="answer-option">
          <input type="radio" name="answer" id="answer${i}" value="${i}" ${isChecked}>
          <label for="answer${i}">${question['answer' + i]}</label>
        </div>
      `;
    }

    questionSec.innerHTML = questionHTML;

    // Add event listeners to radio buttons to update stats when an answer is selected
    const radioButtons = document.querySelectorAll('input[name="answer"]');
    radioButtons.forEach((radio) => {
      radio.addEventListener('change', () => {
        saveCurrentAnswer();
      });
    });
  }

  function updateNavigationUI() {
    // Update next/prev button visibility
    if (qNumber === quizData.sampleQuestions && nextButton) {
      nextButton.style.display = 'none';
      if (finishButton) finishButton.removeAttribute('disabled');
    } else if (qNumber === 1 && prevButton) {
      prevButton.style.display = 'none';
    }

    // Update finish button stats
    updateFinishButtonStats();
  }

  function updateStatsUI() {
    // Count answered, unanswered, and viewed questions
    let answeredCount = 0;
    for (let i = 1; i <= quizData.sampleQuestions; i++) {
      if (answers[i]) answeredCount++;
    }

    const unansweredCount = quizData.sampleQuestions - answeredCount;
    const viewedCount = viewedQuestions.length;

    // Update stats in the panel
    const answeredCountElement = document.getElementById('answeredCount');
    const unansweredCountElement = document.getElementById('unansweredCount');
    const viewedCountElement = document.getElementById('viewedCount');

    if (answeredCountElement) answeredCountElement.textContent = answeredCount;
    if (unansweredCountElement)
      unansweredCountElement.textContent = unansweredCount;
    if (viewedCountElement) viewedCountElement.textContent = viewedCount;

    // Update question grid
    const questionGrid = document.getElementById('questionGrid');
    if (!questionGrid) return;

    const questionButtons = questionGrid.querySelectorAll('.question-number');
    questionButtons.forEach((button) => {
      const questionNum = Number.parseInt(button.dataset.question);

      // Reset classes
      button.className = 'question-number';

      // Add appropriate classes
      if (questionNum === qNumber) {
        button.classList.add('current');
      } else if (answers[questionNum]) {
        button.classList.add('answered');
      } else if (viewedQuestions.includes(questionNum)) {
        button.classList.add('viewed');
      }
    });

    // Update finish button stats
    updateFinishButtonStats();

    // Enable finish button if all questions are answered
    if (answeredCount === quizData.sampleQuestions && finishButton) {
      finishButton.removeAttribute('disabled');
    }
  }

  function updateFinishButtonStats() {
    // Count answered questions for finish button
    let answeredCount = 0;
    for (let i = 1; i <= quizData.sampleQuestions; i++) {
      if (answers[i]) answeredCount++;
    }

    // Update finish button text
    const finishAnsweredCount = document.getElementById('finishAnsweredCount');
    const finishTotalQuestions = document.getElementById(
      'finishTotalQuestions'
    );

    if (finishAnsweredCount) finishAnsweredCount.textContent = answeredCount;
    if (finishTotalQuestions)
      finishTotalQuestions.textContent = quizData.sampleQuestions;
  }

  async function finish() {
    // Save current answer if any
    saveCurrentAnswer();

    // Calculate score
    const numCorrect = calculateCorrectAnswers();
    const totalQuestions = quizData.sampleQuestions;
    const grade = (numCorrect / totalQuestions) * 100;

    // Prepare data for submission
    const requestData = {
      grade: grade,
      score: numCorrect,
      answers: answers,
    };

    // Show appropriate modal based on score
    const successModalGrade = document.getElementById('successModalGrade');
    const successModalTotalQuestions = document.getElementById(
      'successModalTotalQuestions'
    );
    const failModalGrade = document.getElementById('failModalGrade');
    const failModalTotalQuestions = document.getElementById(
      'failModalTotalQuestions'
    );
    const successModalBtn = document.getElementById('successmodelbtn');
    const failModalBtn = document.getElementById('failmodelbtn');

    if (grade >= 50) {
      if (successModalGrade) successModalGrade.innerText = numCorrect;
      if (successModalTotalQuestions)
        successModalTotalQuestions.innerText = totalQuestions;
      if (successModalBtn) successModalBtn.click();
    } else {
      if (failModalGrade) failModalGrade.innerText = numCorrect;
      if (failModalTotalQuestions)
        failModalTotalQuestions.innerText = totalQuestions;
      if (failModalBtn) failModalBtn.click();
    }

    // Submit results to server
    try {
      const response = await fetch(`/student/quizStart/${quizData._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      if (response.ok) {
        // Clear localStorage for this quiz
        localStorage.removeItem('quizAnswers_' + quizData._id);
        localStorage.removeItem('quizViewed_' + quizData._id);
        console.log('Quiz submitted successfully:', data);
      } else {
        console.error('Error submitting quiz:', data);
        alert('حدث خطأ أثناء تقديم الامتحان. يرجى المحاولة مرة أخرى.');
        if (finishButton) finishButton.removeAttribute('disabled');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('حدث خطأ أثناء تقديم الامتحان. يرجى المحاولة مرة أخرى.');
      if (finishButton) finishButton.removeAttribute('disabled');
    }
  }

  function calculateCorrectAnswers() {
    let numCorrect = 0;

    quizQuestions.forEach((question, index) => {
      const questionNumber = index + 1;
      if (answers[questionNumber] === +question.ranswer) {
        numCorrect++;
      }
    });

    return numCorrect;
  }
});
