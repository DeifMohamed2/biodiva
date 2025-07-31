const mongoose = require('mongoose');
const Code = require('./models/Code');
const Chapter = require('./models/Chapter');
const Quiz = require('./models/Quiz');

// MongoDB connection (same as main application)
const dbURI = 'mongodb+srv://deif:1qaz2wsx@3devway.aa4i6ga.mongodb.net/mrWalid?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedTestCodes = async () => {
    try {
        console.log('🌱 Starting codes seed data creation...');

        // Clear existing codes (optional - remove if you want to keep existing codes)
        await Code.deleteMany({});
        console.log('🗑️ Cleared existing codes');

        // Get all chapters and quizzes from database
        const chapters = await Chapter.find({});
        const quizzes = await Quiz.find({});
        
        if (chapters.length === 0) {
            console.log('❌ No chapters found. Please run main seedData.js first');
            return;
        }

        if (quizzes.length === 0) {
            console.log('⚠️  No quizzes found. Quiz codes will be skipped. Run seedData.js first to create quizzes.');
        }

        const testCodes = [];

        // Generate Chapter Purchase Codes
        chapters.forEach((chapter, index) => {
            // Full Chapter Access Codes
            testCodes.push({
                Code: `CHAPTER${chapter.chapterGrade}${(index + 1).toString().padStart(3, '0')}`,
                codeType: 'Chapter',
                codeGrade: chapter.chapterGrade,
                chapterName: chapter.chapterName,
                chapterId: chapter._id,
                isUsed: false,
                isActive: true,
                codeValue: chapter.chapterPrice || 100,
                allowedGrades: [chapter.chapterGrade],
                usageLimit: 1,
                usageCount: 0,
                description: `كود شراء الفصل: ${chapter.chapterName}`
            });

            // Additional Chapter Codes (for testing multiple uses)
            testCodes.push({
                Code: `CH${chapter.chapterGrade}TEST${(index + 1).toString().padStart(2, '0')}`,
                codeType: 'Chapter',
                codeGrade: chapter.chapterGrade,
                chapterName: chapter.chapterName,
                chapterId: chapter._id,
                isUsed: false,
                isActive: true,
                codeValue: chapter.chapterPrice || 100,
                allowedGrades: [chapter.chapterGrade],
                usageLimit: 5, // Can be used 5 times
                usageCount: 0,
                description: `كود تجريبي للفصل: ${chapter.chapterName}`
            });

            // Generate Video Purchase Codes for each chapter
            if (chapter.chapterLectures && chapter.chapterLectures.length > 0) {
                chapter.chapterLectures.forEach((lecture, lectureIndex) => {
                    testCodes.push({
                        Code: `VID${chapter.chapterGrade}L${(index + 1).toString().padStart(2, '0')}${(lectureIndex + 1).toString().padStart(2, '0')}`,
                        codeType: 'Video',
                        codeGrade: chapter.chapterGrade,
                        chapterName: chapter.chapterName,
                        chapterId: chapter._id,
                        contentName: lecture.lectureName || lecture.videoName || `الدرس ${lectureIndex + 1}`,
                        contentId: lecture._id,
                        isUsed: false,
                        isActive: true,
                        codeValue: lecture.lecturePrice || lecture.price || 25,
                        allowedGrades: [chapter.chapterGrade],
                        usageLimit: 1,
                        usageCount: 0,
                        description: `كود شراء فيديو: ${lecture.lectureName || lecture.videoName || `الدرس ${lectureIndex + 1}`}`
                    });
                });
            }

            // Generate codes for summaries
            if (chapter.chapterSummaries && chapter.chapterSummaries.length > 0) {
                chapter.chapterSummaries.forEach((summary, summaryIndex) => {
                    testCodes.push({
                        Code: `VID${chapter.chapterGrade}S${(index + 1).toString().padStart(2, '0')}${(summaryIndex + 1).toString().padStart(2, '0')}`,
                        codeType: 'Video',
                        codeGrade: chapter.chapterGrade,
                        chapterName: chapter.chapterName,
                        chapterId: chapter._id,
                        contentName: summary.lectureName || summary.videoName || `الملخص ${summaryIndex + 1}`,
                        contentId: summary._id,
                        isUsed: false,
                        isActive: true,
                        codeValue: summary.lecturePrice || summary.price || 15,
                        allowedGrades: [chapter.chapterGrade],
                        usageLimit: 1,
                        usageCount: 0,
                        description: `كود شراء ملخص: ${summary.lectureName || summary.videoName || `الملخص ${summaryIndex + 1}`}`
                    });
                });
            }

            // Generate codes for solvings
            if (chapter.chapterSolvings && chapter.chapterSolvings.length > 0) {
                chapter.chapterSolvings.forEach((solving, solvingIndex) => {
                    testCodes.push({
                        Code: `VID${chapter.chapterGrade}T${(index + 1).toString().padStart(2, '0')}${(solvingIndex + 1).toString().padStart(2, '0')}`,
                        codeType: 'Video',
                        codeGrade: chapter.chapterGrade,
                        chapterName: chapter.chapterName,
                        chapterId: chapter._id,
                        contentName: solving.lectureName || solving.videoName || `التطبيق ${solvingIndex + 1}`,
                        contentId: solving._id,
                        isUsed: false,
                        isActive: true,
                        codeValue: solving.lecturePrice || solving.price || 20,
                        allowedGrades: [chapter.chapterGrade],
                        usageLimit: 1,
                        usageCount: 0,
                        description: `كود شراء تطبيق: ${solving.lectureName || solving.videoName || `التطبيق ${solvingIndex + 1}`}`
                    });
                });
            }
        });

        // Add some general test codes
        const generalTestCodes = [
            // Universal Chapter Codes
            {
                Code: 'TESTCHAPTER001',
                codeType: 'Chapter',
                codeGrade: 'Grade1',
                chapterName: 'فصل تجريبي',
                chapterId: chapters[0]._id,
                isUsed: false,
                isActive: true,
                codeValue: 50,
                allowedGrades: ['Grade1', 'Grade2', 'Grade3'],
                usageLimit: 10,
                usageCount: 0,
                description: 'كود تجريبي عام للفصول'
            },
            {
                Code: 'FREECHAPTER',
                codeType: 'Chapter',
                codeGrade: 'Grade1',
                chapterName: 'فصل مجاني',
                chapterId: chapters[0]._id,
                isUsed: false,
                isActive: true,
                codeValue: 0,
                allowedGrades: ['Grade1', 'Grade2', 'Grade3'],
                usageLimit: 100,
                usageCount: 0,
                description: 'كود مجاني للتجربة'
            },
            // Universal Video Codes
            {
                Code: 'TESTVIDEO001',
                codeType: 'Video',
                codeGrade: 'Grade1',
                chapterName: chapters[0].chapterName,
                chapterId: chapters[0]._id,
                contentName: 'فيديو تجريبي',
                contentId: chapters[0].chapterLectures[0]._id,
                isUsed: false,
                isActive: true,
                codeValue: 10,
                allowedGrades: ['Grade1', 'Grade2', 'Grade3'],
                usageLimit: 20,
                usageCount: 0,
                description: 'كود تجريبي للفيديوهات'
            },
            {
                Code: 'FREEVIDEO',
                codeType: 'Video',
                codeGrade: 'Grade1',
                chapterName: chapters[0].chapterName,
                chapterId: chapters[0]._id,
                contentName: 'فيديو مجاني',
                contentId: chapters[0].chapterLectures[0]._id,
                isUsed: false,
                isActive: true,
                codeValue: 0,
                allowedGrades: ['Grade1', 'Grade2', 'Grade3'],
                usageLimit: 50,
                usageCount: 0,
                description: 'كود فيديو مجاني للتجربة'
            }
        ];

        testCodes.push(...generalTestCodes);

        // Generate Quiz Purchase Codes
        if (quizzes.length > 0) {
            quizzes.forEach((quiz, index) => {
                // Individual Quiz Access Codes
                testCodes.push({
                    Code: `QUIZ${quiz.Grade.replace('Grade', '')}${(index + 1).toString().padStart(3, '0')}`,
                    codeType: 'Quiz',
                    codeGrade: quiz.Grade,
                    contentName: quiz.quizName,
                    contentId: quiz._id,
                    isUsed: false,
                    isActive: true,
                    codeValue: quiz.quizPrice || 25,
                    allowedGrades: [quiz.Grade],
                    usageLimit: 1,
                    usageCount: 0,
                    description: `كود شراء اختبار: ${quiz.quizName}`
                });

                // Multiple Use Quiz Codes for testing
                testCodes.push({
                    Code: `QZ${quiz.Grade.replace('Grade', '')}TEST${(index + 1).toString().padStart(2, '0')}`,
                    codeType: 'Quiz',
                    codeGrade: quiz.Grade,
                    contentName: quiz.quizName,
                    contentId: quiz._id,
                    isUsed: false,
                    isActive: true,
                    codeValue: quiz.quizPrice || 25,
                    allowedGrades: [quiz.Grade],
                    usageLimit: 10, // Can be used 10 times
                    usageCount: 0,
                    description: `كود تجريبي للاختبار: ${quiz.quizName}`
                });

                // Free Quiz Codes for testing
                testCodes.push({
                    Code: `FREEQUIZ${quiz.Grade.replace('Grade', '')}${(index + 1).toString().padStart(2, '0')}`,
                    codeType: 'Quiz',
                    codeGrade: quiz.Grade,
                    contentName: quiz.quizName,
                    contentId: quiz._id,
                    isUsed: false,
                    isActive: true,
                    codeValue: 0, // Free
                    allowedGrades: [quiz.Grade],
                    usageLimit: 50,
                    usageCount: 0,
                    description: `كود مجاني للاختبار: ${quiz.quizName}`
                });
            });

            // Universal Quiz Test Codes
            const universalQuizCodes = [
                {
                    Code: 'TESTQUIZ001',
                    codeType: 'Quiz',
                    codeGrade: 'Grade1',
                    contentName: 'اختبار تجريبي',
                    contentId: quizzes[0]._id,
                    isUsed: false,
                    isActive: true,
                    codeValue: 15,
                    allowedGrades: ['Grade1', 'Grade2', 'Grade3'],
                    usageLimit: 20,
                    usageCount: 0,
                    description: 'كود تجريبي عام للاختبارات'
                },
                {
                    Code: 'FREEQUIZTEST',
                    codeType: 'Quiz',
                    codeGrade: 'Grade1',
                    contentName: 'اختبار مجاني',
                    contentId: quizzes[0]._id,
                    isUsed: false,
                    isActive: true,
                    codeValue: 0,
                    allowedGrades: ['Grade1', 'Grade2', 'Grade3'],
                    usageLimit: 100,
                    usageCount: 0,
                    description: 'كود اختبار مجاني للتجربة'
                }
            ];

            testCodes.push(...universalQuizCodes);
        }

        // Add GENERAL CODES - These grant access to ALL content of a specific type within a grade
        const generalAccessCodes = [
            // General Chapter Access for Each Grade
            {
                Code: 'GENERALGRADE1CHAPTERS',
                codeType: 'GeneralChapter',
                codeGrade: 'Grade1',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 500,
                allowedGrades: ['Grade1'],
                usageLimit: 50,
                usageCount: 0,
                description: 'وصول شامل لجميع أبواب الصف الأول'
            },
            {
                Code: 'GENERALGRADE2CHAPTERS',
                codeType: 'GeneralChapter',
                codeGrade: 'Grade2',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 500,
                allowedGrades: ['Grade2'],
                usageLimit: 50,
                usageCount: 0,
                description: 'وصول شامل لجميع أبواب الصف الثاني'
            },
            {
                Code: 'GENERALGRADE3CHAPTERS',
                codeType: 'GeneralChapter',
                codeGrade: 'Grade3',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 500,
                allowedGrades: ['Grade3'],
                usageLimit: 50,
                usageCount: 0,
                description: 'وصول شامل لجميع أبواب الصف الثالث'
            },
            
            // General Video Access for Each Grade
            {
                Code: 'GENERALGRADE1VIDEOS',
                codeType: 'GeneralVideo',
                codeGrade: 'Grade1',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 300,
                allowedGrades: ['Grade1'],
                usageLimit: 50,
                usageCount: 0,
                description: 'وصول شامل لجميع فيديوهات الصف الأول'
            },
            {
                Code: 'GENERALGRADE2VIDEOS',
                codeType: 'GeneralVideo',
                codeGrade: 'Grade2',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 300,
                allowedGrades: ['Grade2'],
                usageLimit: 50,
                usageCount: 0,
                description: 'وصول شامل لجميع فيديوهات الصف الثاني'
            },
            {
                Code: 'GENERALGRADE3VIDEOS',
                codeType: 'GeneralVideo',
                codeGrade: 'Grade3',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 300,
                allowedGrades: ['Grade3'],
                usageLimit: 50,
                usageCount: 0,
                description: 'وصول شامل لجميع فيديوهات الصف الثالث'
            },
            
            // General Quiz Access for Each Grade
            {
                Code: 'GENERALGRADE1QUIZZES',
                codeType: 'GeneralQuiz',
                codeGrade: 'Grade1',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 200,
                allowedGrades: ['Grade1'],
                usageLimit: 50,
                usageCount: 0,
                description: 'وصول شامل لجميع اختبارات الصف الأول'
            },
            {
                Code: 'GENERALGRADE2QUIZZES',
                codeType: 'GeneralQuiz',
                codeGrade: 'Grade2',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 200,
                allowedGrades: ['Grade2'],
                usageLimit: 50,
                usageCount: 0,
                description: 'وصول شامل لجميع اختبارات الصف الثاني'
            },
            {
                Code: 'GENERALGRADE3QUIZZES',
                codeType: 'GeneralQuiz',
                codeGrade: 'Grade3',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 200,
                allowedGrades: ['Grade3'],
                usageLimit: 50,
                usageCount: 0,
                description: 'وصول شامل لجميع اختبارات الصف الثالث'
            },
            
            // Unlimited Access Codes (for testing)
            {
                Code: 'UNLIMITEDCHAPTERS',
                codeType: 'GeneralChapter',
                codeGrade: 'Grade1',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 0,
                allowedGrades: ['Grade1'],
                usageLimit: 999,
                usageCount: 0,
                description: 'وصول غير محدود لأبواب الصف الأول (للتجربة)'
            },
            {
                Code: 'UNLIMITEDVIDEOS',
                codeType: 'GeneralVideo',
                codeGrade: 'Grade1',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 0,
                allowedGrades: ['Grade1'],
                usageLimit: 999,
                usageCount: 0,
                description: 'وصول غير محدود لفيديوهات الصف الأول (للتجربة)'
            },
            {
                Code: 'UNLIMITEDQUIZZES',
                codeType: 'GeneralQuiz',
                codeGrade: 'Grade1',
                isGeneralCode: true,
                isUsed: false,
                isActive: true,
                codeValue: 0,
                allowedGrades: ['Grade1'],
                usageLimit: 999,
                usageCount: 0,
                description: 'وصول غير محدود لاختبارات الصف الأول (للتجربة)'
            }
        ];

        testCodes.push(...generalAccessCodes);

        // Insert all codes
        await Code.insertMany(testCodes);

        console.log(`✅ Successfully created ${testCodes.length} test codes!`);
        console.log('\n📋 Code Categories Created:');
        console.log(`📁 Chapter Codes: ${testCodes.filter(c => c.codeType === 'Chapter').length}`);
        console.log(`🎥 Video Codes: ${testCodes.filter(c => c.codeType === 'Video').length}`);
        console.log(`📝 Quiz Codes: ${testCodes.filter(c => c.codeType === 'Quiz').length}`);
        console.log(`🔓 General Chapter Codes: ${testCodes.filter(c => c.codeType === 'GeneralChapter').length}`);
        console.log(`🔓 General Video Codes: ${testCodes.filter(c => c.codeType === 'GeneralVideo').length}`);
        console.log(`🔓 General Quiz Codes: ${testCodes.filter(c => c.codeType === 'GeneralQuiz').length}`);
        
        console.log('\n🎯 Sample Codes for Testing:');
        console.log('┌─────────────────────────┬──────────────┬─────────────────────────┐');
        console.log('│ Code                    │ Type         │ Description             │');
        console.log('├─────────────────────────┼──────────────┼─────────────────────────┤');
        console.log('│ TESTCHAPTER001          │ Chapter      │ Universal Chapter       │');
        console.log('│ FREECHAPTER             │ Chapter      │ Free Chapter Access     │');
        console.log('│ TESTVIDEO001            │ Video        │ Universal Video         │');
        console.log('│ FREEVIDEO               │ Video        │ Free Video Access       │');
        console.log('│ TESTQUIZ001             │ Quiz         │ Universal Quiz          │');
        console.log('│ FREEQUIZTEST            │ Quiz         │ Free Quiz Access        │');
        console.log('│ GENERALGRADE1CHAPTERS   │ General      │ All Grade 1 Chapters    │');
        console.log('│ GENERALGRADE1VIDEOS     │ General      │ All Grade 1 Videos      │');
        console.log('│ GENERALGRADE1QUIZZES    │ General      │ All Grade 1 Quizzes     │');
        console.log('│ UNLIMITEDCHAPTERS       │ General      │ Unlimited Chapters      │');
        console.log('└─────────────────────────┴──────────────┴─────────────────────────┘');

        // Display some specific chapter codes
        const chapterCodes = testCodes.filter(c => c.codeType === 'Chapter').slice(0, 5);
        console.log('\n📚 Chapter-specific Codes (first 5):');
        chapterCodes.forEach(code => {
            console.log(`📖 ${code.Code} - ${code.chapterName} (${code.codeGrade})`);
        });

        // Display some specific video codes
        const videoCodes = testCodes.filter(c => c.codeType === 'Video').slice(0, 5);
        console.log('\n🎬 Video-specific Codes (first 5):');
        videoCodes.forEach(code => {
            console.log(`🎥 ${code.Code} - ${code.contentName} (${code.codeGrade})`);
        });

        // Display some specific quiz codes
        const quizCodes = testCodes.filter(c => c.codeType === 'Quiz').slice(0, 5);
        if (quizCodes.length > 0) {
            console.log('\n📝 Quiz-specific Codes (first 5):');
            quizCodes.forEach(code => {
                console.log(`📝 ${code.Code} - ${code.contentName} (${code.codeGrade})`);
            });
        }

        console.log('\n🔧 How to Use These Codes:');
        console.log('1. For Chapter Purchase: Use CHAPTERxxx or TESTCHAPTER001 codes');
        console.log('2. For Video Purchase: Use VIDxxx or TESTVIDEO001 codes');
        console.log('3. For Quiz Purchase: Use QUIZxxx or TESTQUIZ001 codes');
        console.log('4. For Free Testing: Use FREECHAPTER, FREEVIDEO, or FREEQUIZTEST codes');
        console.log('5. For General Access: Use GENERALGRADExxx codes for unlimited access');
        console.log('6. Grade-specific: Each code is tagged with the appropriate grade');
        
        console.log('\n🎯 Quiz Code Categories:');
        console.log('• Individual Quiz Codes: QUIZx001, QUIZx002, etc. (one-time use)');
        console.log('• Test Quiz Codes: QZxTEST01, QZxTEST02, etc. (multiple uses)');
        console.log('• Free Quiz Codes: FREEQUIZx01, FREEQUIZx02, etc. (free access)');
        console.log('• Universal Quiz Codes: TESTQUIZ001, FREEQUIZTEST (any grade)');
        console.log('• General Quiz Access: GENERALGRADExQUIZZES (all grade quizzes)');

    } catch (error) {
        console.error('❌ Error creating test codes:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
};

// Export the function for potential reuse
module.exports = seedTestCodes;

// Run the seeding if this file is executed directly
if (require.main === module) {
    seedTestCodes();
} 