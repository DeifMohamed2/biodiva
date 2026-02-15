const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function check() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to database');
    
    const student = await User.findOne({ Code: 622503 });
    if (student && student.quizesInfo) {
      const quiz = student.quizesInfo.find(q => q.quizName && q.quizName.includes('New test'));
      if (quiz) {
        console.log('\n=== Quiz Info ===');
        console.log('Name:', quiz.quizName);
        console.log('Score:', quiz.Score);
        console.log('isEnterd:', quiz.isEnterd);
        console.log('quizVersion:', quiz.quizVersion);
        console.log('questionsSnapshot length:', quiz.questionsSnapshot ? quiz.questionsSnapshot.length : 0);
        console.log('randomQuestionIndices:', quiz.randomQuestionIndices);
        console.log('answers:', JSON.stringify(quiz.answers, null, 2));
        
        if (quiz.questionsSnapshot && quiz.questionsSnapshot.length > 0) {
          console.log('\n=== First Question Snapshot ===');
          console.log(JSON.stringify(quiz.questionsSnapshot[0], null, 2));
        }
      } else {
        console.log('Quiz not found');
      }
    } else {
      console.log('Student not found');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected');
  }
}

check();
