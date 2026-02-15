/**
 * Migration Script: Quiz Snapshots
 * 
 * This script creates questionsSnapshot for students who have already completed quizzes
 * but don't have snapshot data (legacy data before the versioning system was implemented).
 * 
 * IMPORTANT: This script should be run ONCE after deploying the quiz versioning update.
 * 
 * What it does:
 * 1. Finds all students with completed quizzes (isEnterd: true) but no questionsSnapshot
 * 2. For each completed quiz, creates a snapshot based on the current quiz questions
 *    and the stored randomQuestionIndices
 * 3. Sets quizVersion to 1 (or the current quiz version)
 * 
 * WARNING: For students who completed quizzes that were later edited, the snapshot
 * will be based on the CURRENT questions, not the original questions. This is a
 * best-effort migration - the true original questions cannot be recovered.
 * 
 * Usage:
 *   node scripts/migrateQuizSnapshots.js
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

async function migrateQuizSnapshots() {
  console.log('==========================================');
  console.log('Quiz Snapshot Migration Script');
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

    // Find all students with completed quizzes
    const students = await User.find({
      isTeacher: false,
      'quizesInfo.isEnterd': true
    });

    console.log(`Found ${students.length} students with completed quizzes`);
    console.log('');

    let totalMigrated = 0;
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

        // Skip if already has a snapshot
        if (quizInfo.questionsSnapshot && Array.isArray(quizInfo.questionsSnapshot) && quizInfo.questionsSnapshot.length > 0) {
          if (VERBOSE) {
            console.log(`  [SKIP] ${student.Username} (${student.Code}): Quiz "${quizInfo.quizName}" already has snapshot`);
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

        // Create snapshot based on randomQuestionIndices or sequential
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

          if (questionsSnapshot.length > 0) {
            // Update the quizInfo with snapshot and version
            student.quizesInfo[i].questionsSnapshot = questionsSnapshot;
            student.quizesInfo[i].quizVersion = quiz.version || 1;
            studentModified = true;
            totalMigrated++;

            if (VERBOSE) {
              console.log(`  [MIGRATED] ${student.Username} (${student.Code}): Quiz "${quizInfo.quizName}" - ${questionsSnapshot.length} questions`);
            }
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
    console.log('Migration Summary');
    console.log('==========================================');
    console.log(`Total quizzes migrated: ${totalMigrated}`);
    console.log(`Total quizzes skipped (already have snapshot): ${totalSkipped}`);
    console.log(`Total quizzes not found: ${totalNotFound}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log('');

    if (DRY_RUN) {
      console.log('DRY RUN completed - no changes were made to the database.');
      console.log('Run without --dry-run to apply changes.');
    } else {
      console.log('Migration completed successfully!');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

// Run the migration
migrateQuizSnapshots();
