const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
const Chapter = require('./models/Chapter');

// MongoDB connection (same as main application)
const dbURI = 'mongodb+srv://deif:1qaz2wsx@3devway.aa4i6ga.mongodb.net/mrWalid?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedQuizzes = async () => {
    try {
        console.log('🎯 Starting quiz seed data creation...');

        // Clear existing quizzes (optional - comment out if you want to keep existing)
        await Quiz.deleteMany({});
        console.log('🗑️ Cleared existing quizzes');

        // Get all chapters from database
        const chapters = await Chapter.find({});
        
        if (chapters.length === 0) {
            console.log('❌ No chapters found. Please run main seedData.js first');
            return;
        }

        const quizzes = [];

        // Sample questions for different subjects
        const arabicGrammarQuestions = [
            {
                question: "ما هو تعريف المفعول به؟",
                answers: ["ما وقع عليه فعل الفاعل", "الذي قام بالفعل", "ما دل على الزمان", "ما دل على المكان"],
                correctAnswer: 0
            },
            {
                question: "أي من الجمل التالية تحتوي على مفعول به؟",
                answers: ["جاء الطالب", "قرأ أحمد الكتاب", "نام الولد", "ذهب المعلم"],
                correctAnswer: 1
            },
            {
                question: "ما إعراب كلمة 'كتاباً' في جملة 'قرأ الطالب كتاباً'؟",
                answers: ["فاعل مرفوع", "مفعول به منصوب", "مبتدأ مرفوع", "خبر منصوب"],
                correctAnswer: 1
            },
            {
                question: "علامة نصب المفعول به المفرد هي:",
                answers: ["الضمة", "الفتحة", "الكسرة", "السكون"],
                correctAnswer: 1
            },
            {
                question: "في أي حالة يُحذف المفعول به؟",
                answers: ["عندما يكون معلوماً من السياق", "لا يُحذف أبداً", "عندما يكون جمعاً", "عندما يكون مؤنثاً"],
                correctAnswer: 0
            }
        ];

        const literatureQuestions = [
            {
                question: "من هو شاعر المعلقة الذهبية؟",
                answers: ["امرؤ القيس", "زهير بن أبي سلمى", "عنترة بن شداد", "طرفة بن العبد"],
                correctAnswer: 0
            },
            {
                question: "ما هو البحر الشعري الأكثر استخداماً في الشعر الجاهلي؟",
                answers: ["البسيط", "الطويل", "الكامل", "الوافر"],
                correctAnswer: 1
            },
            {
                question: "أي من هذه الصفات تميز الشعر الجاهلي؟",
                answers: ["البساطة في التعبير", "قوة الأسلوب والفخر", "التصوف والزهد", "الغزل العذري"],
                correctAnswer: 1
            },
            {
                question: "ما معنى 'المعلقات' في الأدب الجاهلي؟",
                answers: ["القصائد المعلقة على الكعبة", "الشعر المنقوش على الذهب", "القصائد الطويلة المشهورة", "كل ما سبق صحيح"],
                correctAnswer: 2
            },
            {
                question: "من أشهر شعراء الغزل في العصر الجاهلي؟",
                answers: ["امرؤ القيس", "عنترة بن شداد", "زهير بن أبي سلمى", "الأعشى"],
                correctAnswer: 0
            }
        ];

        const rhetoricQuestions = [
            {
                question: "ما هو التشبيه؟",
                answers: ["مقارنة بين شيئين", "بيان وجه الشبه بين المشبه والمشبه به", "ذكر شيء واحد فقط", "التضاد بين شيئين"],
                correctAnswer: 1
            },
            {
                question: "أركان التشبيه هي:",
                answers: ["المشبه والمشبه به فقط", "المشبه والمشبه به وأداة التشبيه", "المشبه والمشبه به وأداة التشبيه ووجه الشبه", "وجه الشبه فقط"],
                correctAnswer: 2
            },
            {
                question: "أي من هذه أمثلة على الاستعارة؟",
                answers: ["الرجل كالأسد", "رأيت أسداً يقاتل", "الرجل أسد", "الأسد ملك الغابة"],
                correctAnswer: 1
            },
            {
                question: "الكناية هي:",
                answers: ["تشبيه مباشر", "قول يُراد به غير معناه الحقيقي", "لفظ يدل على معناه مع جواز إرادة المعنى الأصلي", "تكرار الكلمات"],
                correctAnswer: 2
            },
            {
                question: "ما الفرق بين التشبيه والاستعارة؟",
                answers: ["لا فرق بينهما", "التشبيه يذكر المشبه والمشبه به، الاستعارة تحذف أحدهما", "الاستعارة أوضح", "التشبيه أقوى في التأثير"],
                correctAnswer: 1
            }
        ];

        // Create quizzes for each chapter with different types (free, paid, chapter-based)
        let quizCounter = 1;

        chapters.forEach((chapter, chapterIndex) => {
            const grade = chapter.chapterGrade;
            
            // Determine questions based on chapter content
            let questionSet = arabicGrammarQuestions;
            if (chapter.chapterName.includes('الأدب')) {
                questionSet = literatureQuestions;
            } else if (chapter.chapterName.includes('البلاغة')) {
                questionSet = rhetoricQuestions;
            }

            // Create 3 quizzes per chapter: 1 free, 2 paid
            
            // 1. Free Quiz (basic level) - Always accessible
            quizzes.push({
                quizName: `اختبار مجاني: ${chapter.chapterName} - المستوى الأساسي`,
                Grade: grade,
                timeOfQuiz: 15,
                questionsCount: 5,
                Questions: questionSet.slice(0, 5), // First 5 questions
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: false, // Free quiz - accessible to all
                quizPrice: 0
            });

            // 2. Paid Quiz (intermediate level) - Requires purchase code
            quizzes.push({
                quizName: `اختبار متقدم: ${chapter.chapterName} - المستوى المتوسط`,
                Grade: grade,
                timeOfQuiz: 25,
                questionsCount: 10,
                Questions: [...questionSet, ...questionSet.slice(0, 5)], // 10 questions total
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: true, // Paid quiz - requires code
                quizPrice: 15
            });

            // 3. Premium Quiz (advanced level) - Requires purchase code
            quizzes.push({
                quizName: `اختبار شامل: ${chapter.chapterName} - المستوى المتقدم`,
                Grade: grade,
                timeOfQuiz: 40,
                questionsCount: 20,
                Questions: [...questionSet, ...questionSet, ...questionSet, ...questionSet].slice(0, 20), // 20 questions
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: true, // Paid quiz - requires code
                quizPrice: 25
            });

            quizCounter += 3;
        });

        // Add general quizzes with mixed access levels
        const generalQuizzes = [
            {
                quizName: "اختبار عام في النحو العربي - مجاني",
                Grade: "Grade1",
                timeOfQuiz: 20,
                questionsCount: 8,
                Questions: [...arabicGrammarQuestions, ...arabicGrammarQuestions.slice(0, 3)], // 8 questions
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: false, // Free - accessible to all
                quizPrice: 0
            },
            {
                quizName: "اختبار شامل في الأدب الجاهلي",
                Grade: "Grade1",
                timeOfQuiz: 35,
                questionsCount: 15,
                Questions: [...literatureQuestions, ...literatureQuestions, ...literatureQuestions], // 15 questions
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: true, // Paid - requires code
                quizPrice: 20
            },
            {
                quizName: "تحدي البلاغة العربية - مجاني",
                Grade: "Grade2",
                timeOfQuiz: 25,
                questionsCount: 10,
                Questions: [...rhetoricQuestions, ...rhetoricQuestions], // 10 questions
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: false, // Free - accessible to all
                quizPrice: 0
            },
            {
                quizName: "اختبار تجريبي مفتوح - الصف الثاني",
                Grade: "Grade2",
                timeOfQuiz: 30,
                questionsCount: 12,
                Questions: [...arabicGrammarQuestions, ...literatureQuestions.slice(0, 2)], // 12 questions
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: false, // Free trial exam
                quizPrice: 0
            },
            {
                quizName: "الامتحان النهائي الشامل - الصف الثاني",
                Grade: "Grade2",
                timeOfQuiz: 60,
                questionsCount: 20,
                Questions: [...arabicGrammarQuestions, ...literatureQuestions, ...rhetoricQuestions, ...arabicGrammarQuestions], // 20 questions
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: true, // Paid - premium exam
                quizPrice: 35
            },
            {
                quizName: "مراجعة سريعة - مجاني",
                Grade: "Grade3",
                timeOfQuiz: 10,
                questionsCount: 4,
                Questions: arabicGrammarQuestions.slice(0, 4), // 4 questions
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: false, // Free - accessible to all
                quizPrice: 0
            },
            {
                quizName: "اختبار تقييمي شامل - مجاني",
                Grade: "Grade1",
                timeOfQuiz: 25,
                questionsCount: 10,
                Questions: [...arabicGrammarQuestions.slice(0, 3), ...literatureQuestions.slice(0, 3), ...rhetoricQuestions.slice(0, 4)], // 10 mixed questions
                isQuizActive: true,
                permissionToShow: true,
                prepaidStatus: false, // Free assessment
                quizPrice: 0
            }
        ];

        quizzes.push(...generalQuizzes);

        // Insert all quizzes
        await Quiz.insertMany(quizzes);

        console.log(`✅ Successfully created ${quizzes.length} quizzes!`);
        console.log('\n📊 Quiz Statistics:');
        console.log(`🆓 Free Quizzes: ${quizzes.filter(q => q.quizPrice === 0).length}`);
        console.log(`💰 Paid Quizzes: ${quizzes.filter(q => q.quizPrice > 0).length}`);
        console.log(`📚 Grade 1 Quizzes: ${quizzes.filter(q => q.Grade === 'Grade1').length}`);
        console.log(`📚 Grade 2 Quizzes: ${quizzes.filter(q => q.Grade === 'Grade2').length}`);
        console.log(`📚 Grade 3 Quizzes: ${quizzes.filter(q => q.Grade === 'Grade3').length}`);

        console.log('\n🎯 Sample Free Quizzes:');
        const freeQuizzes = quizzes.filter(q => q.quizPrice === 0).slice(0, 5);
        freeQuizzes.forEach(quiz => {
            console.log(`🆓 ${quiz.quizName} (${quiz.Grade}) - ${quiz.quizDegree} درجة`);
        });

        console.log('\n💰 Sample Paid Quizzes:');
        const paidQuizzes = quizzes.filter(q => q.quizPrice > 0).slice(0, 5);
        paidQuizzes.forEach(quiz => {
            console.log(`💰 ${quiz.quizName} (${quiz.Grade}) - ${quiz.quizPrice} جنيه - ${quiz.quizDegree} درجة`);
        });

        console.log('\n🎮 How to Test:');
        console.log('1. Free Quizzes: Available to all students immediately');
        console.log('2. Paid Quizzes: Require purchase codes or general quiz access');
        console.log('3. Use general codes: GENERALGRADE1QUIZZES, GENERALGRADE2QUIZZES, etc.');
        console.log('4. Chapter-based quizzes are also accessible with chapter purchase');

    } catch (error) {
        console.error('❌ Error creating quizzes:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
};

// Export the function for potential reuse
module.exports = seedQuizzes;

// Run the seeding if this file is executed directly
if (require.main === module) {
    seedQuizzes();
} 