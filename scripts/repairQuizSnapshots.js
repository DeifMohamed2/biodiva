/**
 * Repair Script: Fix Empty Quiz Snapshots
 * 
 * This script repairs questionsSnapshot data for students who took quizzes
 * when the snapshot was incorrectly saved with empty values (due to Mongoose 
 * document conversion issue).
 * 
 * It finds snapshots where the question data is empty and rebuilds them
 * from the current quiz questions.
 * 
 * Usage:
 *   node scripts/repairQuizSnapshots.js
 * 
 * Options:
 *   --dry-run    : Preview changes without modifying the database
 *   --verbose    : Show detailed progress for each student/quiz
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Quiz = require('../models/Quiz');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

function isSnapshotEmpty(snapshot) {
  if (!snapshot || !Array.isArray(snapshot) || snapshot.length === 0) {
    return true;
  }
  
  // Check if the snapshot has empty question data
  return snapshot.every(q => {
    const hasTitle = q.title && q.title.trim() !== '';
    const hasAnswers = (q.answer1 && q.answer1.trim() !== '') || 
                       (q.answer2 && q.answer2.trim() !== '');
    return !hasTitle && !hasAnswers;
  });
}

async function repairQuizSnapshots() {
  console.log('==========================================');
  console.log('Quiz Snapshot Repair Script');
  console.log('==========================================');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log('');

  try {
    // Connect to database
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to database');
    console.log('');

    // Get all quizzes for reference
    const quizzes = await Quiz.find({});
    const quizMap = new Map();
    quizzes.forEach(quiz => {
      quizMap.set(quiz._id.toString(), quiz);
    });
    console.log(`Found ${quizzes.length} quizzes in database`);

    // Find all students with completed quizzes that have snapshots
    const students = await User.find({
      isTeacher: false,
      'quizesInfo.isEnterd': true,
      'quizesInfo.questionsSnapshot': { $exists: true, $ne: [] }
    });

    console.log(`Found ${students.length} students with completed quizzes that have snapshots`);
    console.log('');

    let totalRepaired = 0;
    let totalSkipped = 0;
    let totalNotFound = 0;
    let totalErrors = 0;

    for (const student of students) {
      if (!student.quizesInfo || !Array.isArray(student.quizesInfo)) {
        continue;
      }

      let studentModified = false;

      for (let i = 0; i < student.quizesInfo.length; i++) {
        const quizInfo = student.quizesInfo[i];

        // Skip if not completed
        if (!quizInfo.isEnterd) {
          continue;
        }

        // Skip if no snapshot exists
        if (!quizInfo.questionsSnapshot || !Array.isArray(quizInfo.questionsSnapshot)) {
          continue;
        }

        // Skip if snapshot is NOT empty (already valid)
        if (!isSnapshotEmpty(quizInfo.questionsSnapshot)) {
          if (VERBOSE) {
            console.log(`  [OK] ${student.Username} (${student.Code}): Quiz "${quizInfo.quizName}" snapshot is valid`);
          }
          totalSkipped++;
          continue;
        }

        // Get the quiz from map
        const quiz = quizMap.get(quizInfo._id.toString());
        if (!quiz) {
          console.log(`  [NOT FOUND] ${student.Username} (${student.Code}): Quiz ID ${quizInfo._id} not found`);
          totalNotFound++;
          continue;
        }

        // Repair the snapshot
        try {
          let questionsSnapshot = [];

          if (quizInfo.randomQuestionIndices && Array.isArray(quizInfo.randomQuestionIndices) && quizInfo.randomQuestionIndices.length > 0) {
            // Use saved random indices
            questionsSnapshot = quizInfo.randomQuestionIndices.map((index, displayIndex) => {
              const questionDoc = quiz.Questions[index];
              if (!questionDoc) {
                return null;
              }
              // Convert Mongoose document to plain object if needed
              const question = questionDoc.toObject ? questionDoc.toObject() : questionDoc;
              
              return {
                id: question.id || question._id?.toString() || `q_${index}`,
                title: question.title || question.question || question.questionText || '',
                questionPhoto: question.questionPhoto || question.image || '',
                image: question.image || question.questionPhoto || '',
                answer1: question.answer1 || '',
                answer2: question.answer2 || '',
                answer3: question.answer3 || '',
                answer4: question.answer4 || '',
                ranswer: question.ranswer,
                originalIndex: index
              };
            }).filter(q => q !== null);
          } else {
            // Fallback: use sequential questions based on questionsToShow
            const questionsToShow = quiz.questionsToShow || quiz.questionsCount;
            questionsSnapshot = quiz.Questions.slice(0, questionsToShow).map((questionDoc, index) => {
              // Convert Mongoose document to plain object if needed
              const question = questionDoc.toObject ? questionDoc.toObject() : questionDoc;
              
              return {
                id: question.id || question._id?.toString() || `q_${index}`,
                title: question.title || question.question || question.questionText || '',
                questionPhoto: question.questionPhoto || question.image || '',
                image: question.image || question.questionPhoto || '',
                answer1: question.answer1 || '',
                answer2: question.answer2 || '',
                answer3: question.answer3 || '',
                answer4: question.answer4 || '',
                ranswer: question.ranswer,
                originalIndex: index
              };
            });
          }

          // Verify the repaired snapshot has data
          if (questionsSnapshot.length > 0 && !isSnapshotEmpty(questionsSnapshot)) {
            // Update the quizInfo with repaired snapshot
            student.quizesInfo[i].questionsSnapshot = questionsSnapshot;
            student.quizesInfo[i].quizVersion = quiz.version || 1;
            studentModified = true;
            totalRepaired++;

            console.log(`  [REPAIRED] ${student.Username} (${student.Code}): Quiz "${quizInfo.quizName}" - ${questionsSnapshot.length} questions`);
            
            if (VERBOSE) {
              console.log(`    First question title: "${questionsSnapshot[0]?.title?.substring(0, 50) || 'N/A'}..."`);
            }
          } else {
            console.log(`  [FAILED] ${student.Username} (${student.Code}): Quiz "${quizInfo.quizName}" - Could not repair snapshot`);
            totalErrors++;
          }
        } catch (err) {
          console.log(`  [ERROR] ${student.Username} (${student.Code}): Quiz "${quizInfo.quizName}" - ${err.message}`);
          totalErrors++;
        }
      }

      // Save student if modified
      if (studentModified && !DRY_RUN) {
        await student.save();
      }
    }

    console.log('');
    console.log('==========================================');
    console.log('Repair Summary');
    console.log('==========================================');
    console.log(`Total quizzes repaired: ${totalRepaired}`);
    console.log(`Total quizzes skipped (already valid): ${totalSkipped}`);
    console.log(`Total quizzes not found: ${totalNotFound}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log('');

    if (DRY_RUN) {
      console.log('DRY RUN completed - no changes were made to the database.');
      console.log('Run without --dry-run to apply changes.');
    } else {
      console.log('Repair completed successfully!');
    }

  } catch (error) {
    console.error('Repair failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

// Run the repair
repairQuizSnapshots();
