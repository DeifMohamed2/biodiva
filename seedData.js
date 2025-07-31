const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const User = require('./models/User');
const Chapter = require('./models/Chapter');
const Quiz = require('./models/Quiz');
const Code = require('./models/Code');
const PDFs = require('./models/PDFs');
const Card = require('./models/Card');

// Database connection
const dbURI = 'mongodb+srv://deif:1qaz2wsx@3devway.aa4i6ga.mongodb.net/mrWalid?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  try {
    await mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Sample data
const sampleChapters = [
  {
    chapterName: 'الأدب في العصر الجاهلي',
    chapterGrade: 'Grade1',
    chapterIMG: '/images/arabic-literature.jpg',
    chapterDescription: 'دراسة الأدب العربي في العصر الجاهلي والشعراء المشهورين',
    chapterAccessibility: 'EnterInPay',
    chapterPrice: 50,
    ARorEN: 'AR',
    ischapterNew: true,
    isActive: true,
    difficulty: 'beginner',
    estimatedDuration: 8,
    tags: ['أدب', 'شعر', 'عصر جاهلي'],
    chapterLectures: [
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'مقدمة في الأدب الجاهلي',
        videoName: 'مقدمة في الأدب الجاهلي',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/9c9983e9-f3e6-4813-adf9-0c22a3cd6927?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 45,
        duration: 45,
        lecturePrice: 0,
        views: 125,
        description: 'مقدمة شاملة في الأدب العربي في العصر الجاهلي وأهم خصائصه',
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'الشعر الجاهلي وخصائصه',
        videoName: 'الشعر الجاهلي وخصائصه',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/a1b2c3d4-e5f6-7890-abc1-def234567890?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Pay',
        prerequisites: 'none',
        lectureDuration: 50,
        duration: 50,
        lecturePrice: 25,
        views: 98,
        description: 'دراسة مفصلة لخصائص الشعر الجاهلي وأساليبه الفنية',
        createdAt: new Date('2024-12-02'),
        updatedAt: new Date('2024-12-02')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'شعراء المعلقات',
        videoName: 'شعراء المعلقات',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/b2c3d4e5-f6g7-8901-bcd2-efg345678901?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Pay',
        prerequisites: 'none',
        lectureDuration: 60,
        duration: 60,
        lecturePrice: 30,
        views: 156,
        description: 'التعرف على أشهر شعراء المعلقات وأعمالهم الشعرية المميزة',
        createdAt: new Date('2024-12-03'),
        updatedAt: new Date('2024-12-03')
      }
    ],
    chapterSummaries: [
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'ملخص الأدب الجاهلي',
        videoName: 'ملخص الأدب الجاهلي',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/c3d4e5f6-g7h8-9012-cde3-fgh456789012?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Pay',
        prerequisites: 'none',
        lectureDuration: 30,
        duration: 30,
        lecturePrice: 15,
        views: 87,
        description: 'ملخص شامل ومراجعة لأهم النقاط في الأدب الجاهلي',
        createdAt: new Date('2024-12-04'),
        updatedAt: new Date('2024-12-04')
      }
    ],
    chapterSolvings: [
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'تطبيقات على الشعر الجاهلي',
        videoName: 'تطبيقات على الشعر الجاهلي',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/d4e5f6g7-h8i9-0123-def4-ghi567890123?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Pay',
        prerequisites: 'none',
        lectureDuration: 40,
        duration: 40,
        lecturePrice: 20,
        views: 63,
        description: 'حل تطبيقات عملية وأمثلة على الشعر الجاهلي',
        createdAt: new Date('2024-12-05'),
        updatedAt: new Date('2024-12-05')
      }
    ]
  },
  {
    chapterName: 'النحو العربي - الجملة الاسمية',
    chapterGrade: 'Grade1',
    chapterIMG: '/images/arabic-grammar.jpg',
    chapterDescription: 'دراسة النحو العربي والجملة الاسمية وأركانها',
    chapterAccessibility: 'EnterInFree',
    chapterPrice: 0,
    ARorEN: 'AR',
    ischapterNew: true,
    isActive: true,
    difficulty: 'intermediate',
    estimatedDuration: 6,
    tags: ['نحو', 'جملة اسمية', 'قواعد'],
    chapterLectures: [
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'مقدمة في النحو العربي',
        videoName: 'مقدمة في النحو العربي',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/e5f6g7h8-i9j0-1234-efg5-hij678901234?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 35,
        duration: 35,
        lecturePrice: 0,
        views: 203,
        description: 'مقدمة أساسية في علم النحو العربي وأهميته',
        createdAt: new Date('2024-12-06'),
        updatedAt: new Date('2024-12-06')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'الجملة الاسمية وأركانها',
        videoName: 'الجملة الاسمية وأركانها',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/f6g7h8i9-j0k1-2345-fgh6-ijk789012345?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 40,
        duration: 40,
        lecturePrice: 0,
        views: 178,
        description: 'شرح مفصل للجملة الاسمية ومكوناتها الأساسية',
        createdAt: new Date('2024-12-07'),
        updatedAt: new Date('2024-12-07')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'المبتدأ والخبر',
        videoName: 'المبتدأ والخبر',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/z8y7x6w5-v4u3-2109-zyx8-wvu210987654?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 45,
        duration: 45,
        lecturePrice: 0,
        views: 156,
        description: 'شرح تفصيلي للمبتدأ والخبر وأنواعهما',
        createdAt: new Date('2024-12-08'),
        updatedAt: new Date('2024-12-08')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'النواسخ - كان وأخواتها',
        videoName: 'النواسخ - كان وأخواتها',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/a9b8c7d6-e5f4-3210-abc9-def432109876?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 50,
        duration: 50,
        lecturePrice: 0,
        views: 142,
        description: 'دراسة كان وأخواتها وعملها في الجملة الاسمية',
        createdAt: new Date('2024-12-09'),
        updatedAt: new Date('2024-12-09')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'إن وأخواتها',
        videoName: 'إن وأخواتها',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/b0c9d8e7-f6g5-4321-bcd0-efg543210987?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 40,
        duration: 40,
        lecturePrice: 0,
        views: 128,
        description: 'شرح إن وأخواتها وأحكامها النحوية',
        createdAt: new Date('2024-12-10'),
        updatedAt: new Date('2024-12-10')
      }
    ],
    chapterSummaries: [
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'ملخص الجملة الاسمية',
        videoName: 'ملخص الجملة الاسمية',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/g7h8i9j0-k1l2-3456-ghi7-jkl890123456?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 25,
        duration: 25,
        lecturePrice: 0,
        views: 134,
        description: 'ملخص مركز للجملة الاسمية وأحكامها',
        createdAt: new Date('2024-12-11'),
        updatedAt: new Date('2024-12-11')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'ملخص النواسخ',
        videoName: 'ملخص النواسخ',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/c1d0e9f8-g7h6-5432-cde1-fgh654321098?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 30,
        duration: 30,
        lecturePrice: 0,
        views: 98,
        description: 'مراجعة شاملة لكان وأخواتها وإن وأخواتها',
        createdAt: new Date('2024-12-12'),
        updatedAt: new Date('2024-12-12')
      }
    ],
    chapterSolvings: [
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'تطبيقات على الجملة الاسمية',
        videoName: 'تطبيقات على الجملة الاسمية',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/h8i9j0k1-l2m3-4567-hij8-klm901234567?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 30,
        duration: 30,
        lecturePrice: 0,
        views: 98,
        description: 'تدريبات عملية وحلول للجملة الاسمية',
        createdAt: new Date('2024-12-13'),
        updatedAt: new Date('2024-12-13')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'تدريبات على النواسخ',
        videoName: 'تدريبات على النواسخ',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/d2e1f0g9-h8i7-6543-def2-ghi765432109?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 35,
        duration: 35,
        lecturePrice: 0,
        views: 76,
        description: 'حلول متنوعة لتدريبات كان وأخواتها وإن وأخواتها',
        createdAt: new Date('2024-12-14'),
        updatedAt: new Date('2024-12-14')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'امتحانات سابقة محلولة',
        videoName: 'امتحانات سابقة محلولة',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/e3f2g1h0-i9j8-7654-efg3-hij876543210?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Free',
        prerequisites: 'none',
        lectureDuration: 40,
        duration: 40,
        lecturePrice: 0,
        views: 54,
        description: 'حل امتحانات سابقة في النحو العربي والجملة الاسمية',
        createdAt: new Date('2024-12-15'),
        updatedAt: new Date('2024-12-15')
      }
    ]
  },
  {
    chapterName: 'البلاغة العربية - التشبيه',
    chapterGrade: 'Grade2',
    chapterIMG: '/images/arabic-rhetoric.jpg',
    chapterDescription: 'دراسة البلاغة العربية وأنواع التشبيه',
    chapterAccessibility: 'EnterInPay',
    chapterPrice: 75,
    ARorEN: 'AR',
    ischapterNew: true,
    isActive: true,
    difficulty: 'advanced',
    estimatedDuration: 10,
    tags: ['بلاغة', 'تشبيه', 'علوم اللغة'],
    chapterLectures: [
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'مقدمة في البلاغة العربية',
        videoName: 'مقدمة في البلاغة العربية',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/i9j0k1l2-m3n4-5678-ijk9-lmn012345678?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Pay',
        prerequisites: 'none',
        lectureDuration: 45,
        duration: 45,
        lecturePrice: 35,
        views: 76,
        description: 'مدخل شامل إلى علم البلاغة العربية وأقسامه',
        createdAt: new Date('2024-12-10'),
        updatedAt: new Date('2024-12-10')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'التشبيه وأركانه',
        videoName: 'التشبيه وأركانه',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/j0k1l2m3-n4o5-6789-jkl0-mno123456789?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Pay',
        prerequisites: 'none',
        lectureDuration: 50,
        duration: 50,
        lecturePrice: 40,
        views: 58,
        description: 'دراسة تفصيلية للتشبيه وأركانه الأربعة',
        createdAt: new Date('2024-12-11'),
        updatedAt: new Date('2024-12-11')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'أنواع التشبيه',
        videoName: 'أنواع التشبيه',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/k1l2m3n4-o5p6-7890-klm1-nop234567890?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Pay',
        prerequisites: 'none',
        lectureDuration: 55,
        duration: 55,
        lecturePrice: 45,
        views: 42,
        description: 'شرح مفصل لأنواع التشبيه المختلفة مع الأمثلة',
        createdAt: new Date('2024-12-12'),
        updatedAt: new Date('2024-12-12')
      }
    ],
    chapterSummaries: [
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'ملخص البلاغة والتشبيه',
        videoName: 'ملخص البلاغة والتشبيه',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/l2m3n4o5-p6q7-8901-lmn2-opq345678901?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Pay',
        prerequisites: 'none',
        lectureDuration: 35,
        duration: 35,
        lecturePrice: 25,
        views: 51,
        description: 'مراجعة شاملة لأهم موضوعات البلاغة والتشبيه',
        createdAt: new Date('2024-12-13'),
        updatedAt: new Date('2024-12-13')
      }
    ],
    chapterSolvings: [
      {
        _id: new mongoose.Types.ObjectId(),
        lectureName: 'تطبيقات على التشبيه',
        videoName: 'تطبيقات على التشبيه',
        videoUrl: '<div style="position:relative;padding-top:56.25%;"><iframe src="https://iframe.mediadelivery.net/embed/406337/m3n4o5p6-q7r8-9012-mno3-pqr456789012?autoplay=false&loop=false&muted=false&preload=true&responsive=true" loading="lazy" style="border:0;position:absolute;top:0;height:100%;width:100%;" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen="true"></iframe></div>',
        paymentStatus: 'Pay',
        prerequisites: 'none',
        lectureDuration: 45,
        duration: 45,
        lecturePrice: 30,
        views: 39,
        description: 'تدريبات عملية وحلول متنوعة على أنواع التشبيه',
        createdAt: new Date('2024-12-14'),
        updatedAt: new Date('2024-12-14')
      }
    ]
  }
];

const sampleQuizzes = [
  {
    quizName: 'اختبار الأدب الجاهلي',
    timeOfQuiz: 30,
    questionsCount: 10,
    isQuizActive: true,
    permissionToShow: true,
    Grade: 'Grade1',
    prepaidStatus: true,
    chapterName: 'الأدب في العصر الجاهلي',
    Questions: [
      {
        qNumber: 1,
        title: 'من هو شاعر المعلقة الأولى؟',
        answer1: 'امرؤ القيس',
        answer2: 'طرفة بن العبد',
        answer3: 'زهير بن أبي سلمى',
        answer4: 'عنترة بن شداد',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 2,
        title: 'ما هو البحر الشعري الأكثر استخداماً في الشعر الجاهلي؟',
        answer1: 'البسيط',
        answer2: 'الطويل',
        answer3: 'الكامل',
        answer4: 'الوافر',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 3,
        title: 'ما هي أهم موضوعات الشعر الجاهلي؟',
        answer1: 'الغزل والوصف',
        answer2: 'المدح والهجاء',
        answer3: 'الحماسة والفخر',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 4,
        title: 'ما معنى كلمة "معلقة" في الأدب الجاهلي؟',
        answer1: 'قصيدة طويلة مشهورة',
        answer2: 'قصيدة قصيرة',
        answer3: 'نوع من الرجز',
        answer4: 'شعر الرثاء',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 5,
        title: 'من هو صاحب معلقة "قفا نبك من ذكرى حبيب ومنزل"؟',
        answer1: 'طرفة بن العبد',
        answer2: 'امرؤ القيس',
        answer3: 'لبيد بن ربيعة',
        answer4: 'الأعشى',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 6,
        title: 'ما هي خصائص الشعر الجاهلي؟',
        answer1: 'القوة والجزالة',
        answer2: 'الصدق في التعبير',
        answer3: 'الوضوح والبساطة',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 7,
        title: 'كم عدد المعلقات المشهورة؟',
        answer1: 'خمس معلقات',
        answer2: 'سبع معلقات',
        answer3: 'عشر معلقات',
        answer4: 'اثنتا عشرة معلقة',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 8,
        title: 'ما هو الغرض الشعري الذي برع فيه عنترة بن شداد؟',
        answer1: 'الغزل',
        answer2: 'المدح',
        answer3: 'الحماسة والفروسية',
        answer4: 'الهجاء',
        correctAnswer: 'answer3'
      },
      {
        qNumber: 9,
        title: 'أي من هؤلاء الشعراء لُقب بـ "الملك الضليل"؟',
        answer1: 'امرؤ القيس',
        answer2: 'طرفة بن العبد',
        answer3: 'زهير بن أبي سلمى',
        answer4: 'النابغة الذبياني',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 10,
        title: 'ما هي أشهر أسواق العرب في الجاهلية للشعر؟',
        answer1: 'سوق عكاظ',
        answer2: 'سوق مجنة',
        answer3: 'سوق ذي المجاز',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      }
    ]
  },
  {
    quizName: 'اختبار النحو العربي',
    timeOfQuiz: 25,
    questionsCount: 8,
    isQuizActive: true,
    permissionToShow: true,
    Grade: 'Grade1',
    prepaidStatus: false,
    chapterName: 'النحو العربي - الجملة الاسمية',
    Questions: [
      {
        qNumber: 1,
        title: 'ما هي أركان الجملة الاسمية؟',
        answer1: 'المبتدأ والخبر',
        answer2: 'الفعل والفاعل',
        answer3: 'المفعول به والحال',
        answer4: 'النعت والمنعوت',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 2,
        title: 'ما إعراب كلمة "محمد" في جملة "محمد طالب مجتهد"؟',
        answer1: 'مبتدأ مرفوع',
        answer2: 'خبر مرفوع',
        answer3: 'فاعل مرفوع',
        answer4: 'مفعول به منصوب',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 3,
        title: 'متى يكون المبتدأ نكرة؟',
        answer1: 'إذا كان مضافاً',
        answer2: 'إذا كان موصوفاً',
        answer3: 'إذا تقدم عليه خبره',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 4,
        title: 'ما نوع الخبر في جملة "العلم نور"؟',
        answer1: 'خبر مفرد',
        answer2: 'خبر جملة اسمية',
        answer3: 'خبر جملة فعلية',
        answer4: 'خبر شبه جملة',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 5,
        title: 'ما إعراب "في المدرسة" في جملة "الطلاب في المدرسة"؟',
        answer1: 'خبر شبه جملة',
        answer2: 'مفعول فيه',
        answer3: 'جار ومجرور',
        answer4: 'الأول والثالث صحيحان',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 6,
        title: 'متى يجب تقديم الخبر على المبتدأ؟',
        answer1: 'إذا كان الخبر شبه جملة والمبتدأ نكرة',
        answer2: 'إذا كان المبتدأ ضميراً',
        answer3: 'إذا كان الخبر جملة',
        answer4: 'لا يجب أبداً',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 7,
        title: 'ما نوع "كان" في الجملة "كان الطالب مجتهداً"؟',
        answer1: 'فعل تام',
        answer2: 'فعل ناقص',
        answer3: 'حرف ناسخ',
        answer4: 'فعل أمر',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 8,
        title: 'ما إعراب "مجتهداً" في الجملة السابقة؟',
        answer1: 'مبتدأ',
        answer2: 'خبر كان منصوب',
        answer3: 'اسم كان مرفوع',
        answer4: 'مفعول به',
        correctAnswer: 'answer2'
      }
    ]
  },
  {
    quizName: 'اختبار النواسخ المتقدم',
    timeOfQuiz: 30,
    questionsCount: 10,
    isQuizActive: true,
    permissionToShow: true,
    Grade: 'Grade1',
    prepaidStatus: false,
    chapterName: 'النحو العربي - الجملة الاسمية',
    Questions: [
      {
        qNumber: 1,
        title: 'ما إعراب "طالبين" في جملة "كان الرجلان طالبين"؟',
        answer1: 'اسم كان مرفوع',
        answer2: 'خبر كان منصوب',
        answer3: 'مبتدأ مرفوع',
        answer4: 'خبر مرفوع',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 2,
        title: 'أي من الأفعال التالية من أخوات كان؟',
        answer1: 'صار',
        answer2: 'أصبح',
        answer3: 'ظل',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 3,
        title: 'ما إعراب "محمداً" في جملة "إن محمداً مجتهد"؟',
        answer1: 'اسم إن منصوب',
        answer2: 'خبر إن مرفوع',
        answer3: 'مفعول به',
        answer4: 'مبتدأ',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 4,
        title: 'متى يجوز حذف خبر كان؟',
        answer1: 'إذا دل عليه دليل',
        answer2: 'مع الاستفهام',
        answer3: 'بعد أم وبل',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 5,
        title: 'ما معنى "ليس" في الجملة "ليس الطالب حاضراً"؟',
        answer1: 'النفي',
        answer2: 'الإثبات',
        answer3: 'الاستفهام',
        answer4: 'التمني',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 6,
        title: 'أي من الحروف التالية من أخوات إن؟',
        answer1: 'أن',
        answer2: 'كأن',
        answer3: 'لكن',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 7,
        title: 'ما إعراب "سعيداً" في "ما زال الطالب سعيداً"؟',
        answer1: 'اسم ما زال',
        answer2: 'خبر ما زال منصوب',
        answer3: 'مفعول به',
        answer4: 'حال',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 8,
        title: 'متى يتقدم خبر إن على اسمها؟',
        answer1: 'إذا كان الخبر شبه جملة والاسم نكرة',
        answer2: 'إذا كان الاسم ضميراً متصلاً',
        answer3: 'وجوباً دائماً',
        answer4: 'الأول والثاني صحيحان',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 9,
        title: 'ما نوع خبر كان في "كان الطالب في الفصل"؟',
        answer1: 'خبر مفرد',
        answer2: 'خبر جملة اسمية',
        answer3: 'خبر شبه جملة',
        answer4: 'خبر جملة فعلية',
        correctAnswer: 'answer3'
      },
      {
        qNumber: 10,
        title: 'ما إعراب "مدرساً" في "أصبح أحمد مدرساً"؟',
        answer1: 'اسم أصبح',
        answer2: 'خبر أصبح منصوب',
        answer3: 'مفعول به',
        answer4: 'تمييز',
        correctAnswer: 'answer2'
      }
    ]
  },
  {
    quizName: 'اختبار شامل في الجملة الاسمية',
    timeOfQuiz: 40,
    questionsCount: 15,
    isQuizActive: true,
    permissionToShow: true,
    Grade: 'Grade1',
    prepaidStatus: false,
    chapterName: 'النحو العربي - الجملة الاسمية',
    Questions: [
      {
        qNumber: 1,
        title: 'أعرب "الطلاب" في جملة "الطلاب مجتهدون"',
        answer1: 'مبتدأ مرفوع وعلامة رفعه الواو',
        answer2: 'خبر مرفوع وعلامة رفعه الواو',
        answer3: 'فاعل مرفوع وعلامة رفعه الواو',
        answer4: 'اسم كان مرفوع',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 2,
        title: 'ما علامة إعراب المثنى في حالة الرفع؟',
        answer1: 'الضمة',
        answer2: 'الألف',
        answer3: 'الواو',
        answer4: 'الياء',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 3,
        title: 'أعرب "الكتابان" في "الكتابان مفيدان"',
        answer1: 'مبتدأ مرفوع وعلامة رفعه الألف',
        answer2: 'خبر مرفوع وعلامة رفعه الألف',
        answer3: 'مفعول به منصوب',
        answer4: 'اسم كان مرفوع',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 4,
        title: 'متى يكون الخبر واجب التأخير؟',
        answer1: 'إذا كان المبتدأ نكرة والخبر شبه جملة',
        answer2: 'إذا كان المبتدأ معرفة',
        answer3: 'إذا كان الخبر مفرداً',
        answer4: 'لا يجب التأخير أبداً',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 5,
        title: 'ما إعراب "في البيت" في "رجل في البيت"؟',
        answer1: 'خبر مقدم',
        answer2: 'جار ومجرور في محل رفع خبر مقدم',
        answer3: 'مفعول فيه',
        answer4: 'حال',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 6,
        title: 'أي مما يلي لا يعتبر من النواسخ؟',
        answer1: 'كان',
        answer2: 'إن',
        answer3: 'في',
        answer4: 'ليس',
        correctAnswer: 'answer3'
      },
      {
        qNumber: 7,
        title: 'ما إعراب "طالبات" في "كن الفتيات طالبات"؟',
        answer1: 'اسم كان مرفوع',
        answer2: 'خبر كان منصوب',
        answer3: 'مبتدأ مؤخر',
        answer4: 'خبر مرفوع',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 8,
        title: 'متى يحذف المبتدأ وجوباً؟',
        answer1: 'بعد لولا',
        answer2: 'في التعجب',
        answer3: 'بعد فاء الجزاء',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 9,
        title: 'ما نوع "لا" في "لا طالب في الفصل"؟',
        answer1: 'نافية للجنس',
        answer2: 'نافية للوحدة',
        answer3: 'ناهية',
        answer4: 'زائدة',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 10,
        title: 'أعرب "قائماً" في "ما دام الحارس قائماً"',
        answer1: 'اسم ما دام',
        answer2: 'خبر ما دام منصوب',
        answer3: 'حال',
        answer4: 'مفعول مطلق',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 11,
        title: 'ما إعراب "أن" في "علمت أن الطالب مجتهد"؟',
        answer1: 'حرف توكيد ونصب',
        answer2: 'حرف جر',
        answer3: 'حرف استفهام',
        answer4: 'حرف عطف',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 12,
        title: 'متى يجوز تقديم خبر ليس على اسمها؟',
        answer1: 'إذا كان الخبر ظرفاً أو جاراً ومجروراً',
        answer2: 'إذا كان الاسم نكرة',
        answer3: 'إذا كان هناك ضمير يعود على الخبر',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 13,
        title: 'ما علامة نصب جمع المؤنث السالم؟',
        answer1: 'الفتحة',
        answer2: 'الكسرة',
        answer3: 'الياء',
        answer4: 'الواو',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 14,
        title: 'أعرب "المؤمنات" في "إن المؤمنات صابرات"',
        answer1: 'اسم إن منصوب وعلامة نصبه الكسرة',
        answer2: 'خبر إن مرفوع',
        answer3: 'مبتدأ مرفوع',
        answer4: 'مفعول به منصوب',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 15,
        title: 'ما الفرق بين "كان" و "أصبح"؟',
        answer1: 'لا فرق بينهما',
        answer2: 'كان للماضي وأصبح للحاضر',
        answer3: 'كان مطلقة وأصبح مقيدة بالصباح',
        answer4: 'كان ناقصة وأصبح تامة',
        correctAnswer: 'answer3'
      }
    ]
  },
  {
    quizName: 'اختبار البلاغة والتشبيه',
    timeOfQuiz: 35,
    questionsCount: 12,
    isQuizActive: true,
    permissionToShow: true,
    Grade: 'Grade2',
    prepaidStatus: true,
    chapterName: 'البلاغة العربية - التشبيه',
    Questions: [
      {
        qNumber: 1,
        title: 'ما هي أركان التشبيه؟',
        answer1: 'المشبه والمشبه به',
        answer2: 'المشبه والمشبه به وأداة التشبيه',
        answer3: 'المشبه والمشبه به وأداة التشبيه ووجه الشبه',
        answer4: 'المشبه والمشبه به ووجه الشبه فقط',
        correctAnswer: 'answer3'
      },
      {
        qNumber: 2,
        title: 'ما نوع التشبيه في "محمد كالأسد في الشجاعة"؟',
        answer1: 'تشبيه مرسل مفصل',
        answer2: 'تشبيه مؤكد مجمل',
        answer3: 'تشبيه مرسل مجمل',
        answer4: 'تشبيه مؤكد مفصل',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 3,
        title: 'متى يسمى التشبيه "بليغاً"؟',
        answer1: 'إذا حُذفت الأداة',
        answer2: 'إذا حُذف وجه الشبه',
        answer3: 'إذا حُذفت الأداة ووجه الشبه',
        answer4: 'إذا حُذف المشبه به',
        correctAnswer: 'answer3'
      },
      {
        qNumber: 4,
        title: 'ما المقصود بالاستعارة؟',
        answer1: 'تشبيه حذف أحد طرفيه',
        answer2: 'مجاز لغوي',
        answer3: 'كناية عن صفة',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 5,
        title: 'في قول الشاعر "رأيت أسداً يحمل سيفاً"، ما نوع الاستعارة؟',
        answer1: 'استعارة تصريحية',
        answer2: 'استعارة مكنية',
        answer3: 'تشبيه بليغ',
        answer4: 'كناية',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 6,
        title: 'ما الفرق بين التشبيه والاستعارة؟',
        answer1: 'لا فرق بينهما',
        answer2: 'التشبيه يذكر الطرفين والاستعارة تحذف أحدهما',
        answer3: 'الاستعارة أبلغ من التشبيه',
        answer4: 'الثاني والثالث صحيحان',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 7,
        title: 'ما نوع الكناية في "طويل النجاد"؟',
        answer1: 'كناية عن صفة',
        answer2: 'كناية عن موصوف',
        answer3: 'كناية عن نسبة',
        answer4: 'ليست كناية',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 8,
        title: 'أي من الأمثلة التالية يحتوي على استعارة مكنية؟',
        answer1: 'رأيت أسداً في المعركة',
        answer2: 'خاطبني الليل بصوته',
        answer3: 'محمد بحر في الكرم',
        answer4: 'العلم نور',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 9,
        title: 'ما المقصود بالطباق؟',
        answer1: 'الجمع بين الضدين',
        answer2: 'تكرار اللفظ',
        answer3: 'التشبيه البليغ',
        answer4: 'الاستعارة التصريحية',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 10,
        title: 'في قوله تعالى "وتحسبهم أيقاظاً وهم رقود"، ما نوع البديع؟',
        answer1: 'طباق إيجاب',
        answer2: 'طباق سلب',
        answer3: 'جناس',
        answer4: 'سجع',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 11,
        title: 'ما الفرق بين المجاز المرسل والاستعارة؟',
        answer1: 'لا فرق بينهما',
        answer2: 'المجاز المرسل علاقته غير المشابهة',
        answer3: 'الاستعارة علاقتها المشابهة',
        answer4: 'الثاني والثالث صحيحان',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 12,
        title: 'ما علاقة المجاز في "شربت الكأس"؟',
        answer1: 'المحلية',
        answer2: 'الحالية',
        answer3: 'الظرفية',
        answer4: 'السببية',
        correctAnswer: 'answer1'
      }
    ]
  },
  {
    quizName: 'اختبار النحو والصرف',
    timeOfQuiz: 40,
    questionsCount: 15,
    isQuizActive: true,
    permissionToShow: true,
    Grade: 'Grade1',
    prepaidStatus: false,
    chapterName: 'النحو العربي - الجملة الاسمية',
    Questions: [
      {
        qNumber: 1,
        title: 'ما هي علامة رفع الاسم المثنى؟',
        answer1: 'الألف',
        answer2: 'الواو',
        answer3: 'الياء',
        answer4: 'النون',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 2,
        title: 'متى يُجزم الفعل المضارع؟',
        answer1: 'إذا سبقه أداة نصب',
        answer2: 'إذا سبقه أداة جزم',
        answer3: 'إذا سبقه حرف جر',
        answer4: 'إذا سبقه اسم',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 3,
        title: 'ما إعراب "طلابٌ" في جملة "حضر طلابٌ مجتهدون"؟',
        answer1: 'فاعل مرفوع',
        answer2: 'مبتدأ مرفوع',
        answer3: 'مفعول به منصوب',
        answer4: 'نعت مرفوع',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 4,
        title: 'ما نوع الجملة "الطالب مجتهد"؟',
        answer1: 'جملة فعلية',
        answer2: 'جملة اسمية',
        answer3: 'جملة شرطية',
        answer4: 'جملة استفهامية',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 5,
        title: 'كم عدد الأوزان في فعل الأمر؟',
        answer1: 'وزن واحد',
        answer2: 'وزنان',
        answer3: 'ثلاثة أوزان',
        answer4: 'أربعة أوزان',
        correctAnswer: 'answer3'
      }
    ]
  },
  {
    quizName: 'اختبار الأدب الحديث',
    timeOfQuiz: 35,
    questionsCount: 12,
    isQuizActive: true,
    permissionToShow: true,
    Grade: 'Grade2',
    prepaidStatus: true,
    chapterName: 'البلاغة العربية - التشبيه',
    Questions: [
      {
        qNumber: 1,
        title: 'من رواد الشعر الحديث في مصر؟',
        answer1: 'أحمد شوقي',
        answer2: 'خليل مطران',
        answer3: 'حافظ إبراهيم',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      },
      {
        qNumber: 2,
        title: 'ما خصائص الشعر الحر؟',
        answer1: 'التحرر من الوزن والقافية',
        answer2: 'الالتزام بالبحور التقليدية',
        answer3: 'التقيد بالقافية الموحدة',
        answer4: 'لا شيء مما سبق',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 3,
        title: 'من أشهر رواد أدب المهجر؟',
        answer1: 'جبران خليل جبران',
        answer2: 'إيليا أبو ماضي',
        answer3: 'ميخائيل نعيمة',
        answer4: 'جميع ما سبق',
        correctAnswer: 'answer4'
      }
    ]
  },
  {
    quizName: 'امتحان شامل - النحو والإعراب',
    timeOfQuiz: 50,
    questionsCount: 20,
    isQuizActive: true,
    permissionToShow: true,
    Grade: 'Grade1',
    prepaidStatus: true,
    chapterName: 'النحو العربي - الجملة الاسمية',
    Questions: [
      {
        qNumber: 1,
        title: 'ما إعراب "المعلمُ" في جملة "المعلمُ مخلصٌ"؟',
        answer1: 'مبتدأ مرفوع وعلامة رفعه الضمة',
        answer2: 'خبر مرفوع وعلامة رفعه الضمة',
        answer3: 'فاعل مرفوع وعلامة رفعه الضمة',
        answer4: 'مفعول به منصوب',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 2,
        title: 'ما نوع "مخلصٌ" في الجملة السابقة؟',
        answer1: 'مبتدأ',
        answer2: 'خبر مفرد',
        answer3: 'خبر جملة',
        answer4: 'خبر شبه جملة',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 3,
        title: 'أعرب "في المدرسة" في جملة "الطلاب في المدرسة"',
        answer1: 'خبر شبه جملة في محل رفع',
        answer2: 'مفعول فيه منصوب',
        answer3: 'حال منصوب',
        answer4: 'مضاف إليه مجرور',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 4,
        title: 'متى يجوز حذف المبتدأ؟',
        answer1: 'لا يجوز حذفه أبداً',
        answer2: 'إذا دل عليه دليل',
        answer3: 'في أول الكلام فقط',
        answer4: 'مع النكرة فقط',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 5,
        title: 'ما علامة إعراب المثنى في حالة الرفع؟',
        answer1: 'الضمة',
        answer2: 'الألف',
        answer3: 'الواو',
        answer4: 'الياء',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 6,
        title: 'أعرب "المعلمان" في جملة "المعلمان مجتهدان"',
        answer1: 'مبتدأ مرفوع وعلامة رفعه الضمة',
        answer2: 'مبتدأ مرفوع وعلامة رفعه الألف',
        answer3: 'خبر مرفوع وعلامة رفعه الألف',
        answer4: 'فاعل مرفوع وعلامة رفعه الألف',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 7,
        title: 'ما نوع الخبر في "الطلاب يدرسون"؟',
        answer1: 'خبر مفرد',
        answer2: 'خبر جملة اسمية',
        answer3: 'خبر جملة فعلية',
        answer4: 'خبر شبه جملة',
        correctAnswer: 'answer3'
      },
      {
        qNumber: 8,
        title: 'في أي حالة يجب تقديم الخبر على المبتدأ؟',
        answer1: 'إذا كان الخبر مفرداً',
        answer2: 'إذا كان المبتدأ معرفة والخبر نكرة',
        answer3: 'إذا كان الخبر شبه جملة والمبتدأ نكرة',
        answer4: 'لا يجب أبداً',
        correctAnswer: 'answer3'
      },
      {
        qNumber: 9,
        title: 'ما إعراب "كتابان" في "على المكتب كتابان"؟',
        answer1: 'مبتدأ مؤخر مرفوع وعلامة رفعه الألف',
        answer2: 'خبر مقدم مرفوع وعلامة رفعه الألف',
        answer3: 'مفعول به منصوب',
        answer4: 'مضاف إليه مجرور',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 10,
        title: 'ما هو الناسخ في "كان الطالب مجتهداً"؟',
        answer1: 'الطالب',
        answer2: 'كان',
        answer3: 'مجتهداً',
        answer4: 'لا يوجد ناسخ',
        correctAnswer: 'answer2'
      }
    ]
  },
  {
    quizName: 'اختبار مراجعة - قواعد الإعراب',
    timeOfQuiz: 30,
    questionsCount: 12,
    isQuizActive: true,
    permissionToShow: true,
    Grade: 'Grade1',
    prepaidStatus: false,
    chapterName: 'النحو العربي - الجملة الاسمية',
    Questions: [
      {
        qNumber: 1,
        title: 'ما الفرق بين الجملة الاسمية والفعلية؟',
        answer1: 'الاسمية تبدأ باسم والفعلية تبدأ بفعل',
        answer2: 'لا فرق بينهما',
        answer3: 'الاسمية أطول من الفعلية',
        answer4: 'الفعلية تحتوي على مبتدأ وخبر',
        correctAnswer: 'answer1'
      },
      {
        qNumber: 2,
        title: 'كم عدد أركان الجملة الاسمية الأساسية؟',
        answer1: 'ركن واحد',
        answer2: 'ركنان',
        answer3: 'ثلاثة أركان',
        answer4: 'أربعة أركان',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 3,
        title: 'ما حكم إعراب المبتدأ؟',
        answer1: 'منصوب دائماً',
        answer2: 'مجرور دائماً',
        answer3: 'مرفوع دائماً',
        answer4: 'يختلف حسب موقعه',
        correctAnswer: 'answer3'
      },
      {
        qNumber: 4,
        title: 'أي من الجمل التالية اسمية؟',
        answer1: 'يكتب الطالب الدرس',
        answer2: 'الطالب يكتب الدرس',
        answer3: 'اكتب الدرس',
        answer4: 'هل كتبت الدرس؟',
        correctAnswer: 'answer2'
      },
      {
        qNumber: 5,
        title: 'ما علامة رفع جمع المذكر السالم؟',
        answer1: 'الضمة',
        answer2: 'الألف',
        answer3: 'الواو',
        answer4: 'الياء',
        correctAnswer: 'answer3'
      }
    ]
  }
];

const sampleUsers = [
  {
    Username: 'أحمد محمد علي',
    Password: '$2b$10$hash1',
    PasswordWithOutHash: 'password123',
    gov: 'القاهرة',
    Markez: 'مدينة نصر',
    Grade: 'Grade1',
    gender: 'male',
    phone: '01012345678',
    parentPhone: '01087654321',
    place: 'online',
    Code: 100001,
    subscribe: true,
    isTeacher: false,
    totalScore: 85,
    examsEnterd: 3,
    totalQuestions: 30,
    totalSubscribed: 2,
    ARorEN: 'AR',
    chaptersPaid: [],
    videosPaid: [],
    examsPaid: [],
    PDFsPaid: [],
    quizesInfo: [],
    videosInfo: []
  },
  {
    Username: 'فاطمة أحمد محمود',
    Password: '$2b$10$hash2',
    PasswordWithOutHash: 'password123',
    gov: 'الجيزة',
    Markez: 'الدقي',
    Grade: 'Grade1',
    gender: 'female',
    phone: '01123456789',
    parentPhone: '01198765432',
    place: 'online',
    Code: 100002,
    subscribe: true,
    isTeacher: false,
    totalScore: 92,
    examsEnterd: 4,
    totalQuestions: 40,
    totalSubscribed: 3,
    ARorEN: 'AR',
    chaptersPaid: [],
    videosPaid: [],
    examsPaid: [],
    PDFsPaid: [],
    quizesInfo: [],
    videosInfo: []
  },
  {
    Username: 'محمد عبد الرحمن',
    Password: '$2b$10$hash3',
    PasswordWithOutHash: 'password123',
    gov: 'الإسكندرية',
    Markez: 'سيدي جابر',
    Grade: 'Grade2',
    gender: 'male',
    phone: '01234567890',
    parentPhone: '01209876543',
    place: 'online',
    Code: 100003,
    subscribe: true,
    isTeacher: false,
    totalScore: 78,
    examsEnterd: 2,
    totalQuestions: 24,
    totalSubscribed: 1,
    ARorEN: 'AR',
    chaptersPaid: [],
    videosPaid: [],
    examsPaid: [],
    PDFsPaid: [],
    quizesInfo: [],
    videosInfo: []
  },
  {
    Username: 'د. وليد هندي',
    Password: '$2b$10$teacherhash',
    PasswordWithOutHash: 'teacher123',
    gov: 'القاهرة',
    Markez: 'المعادي',
    Grade: 'Grade1',
    gender: 'male',
    phone: '01111111111',
    parentPhone: '01111111111',
    place: 'online',
    Code: 999999,
    subscribe: true,
    isTeacher: true,
    totalScore: 0,
    examsEnterd: 0,
    totalQuestions: 0,
    totalSubscribed: 0,
    ARorEN: 'AR',
    chaptersPaid: [],
    videosPaid: [],
    examsPaid: [],
    PDFsPaid: [],
    quizesInfo: [],
    videosInfo: []
  }
];

const sampleCodes = [
  { 
    Code: 'AR2024001', 
    codeType: 'Chapter', 
    codeGrade: 'Grade1',
    chapterName: 'الأدب في العصر الجاهلي', 
    chapterId: null, // Will be populated after chapters are created
    isUsed: false,
    isActive: true,
    codeValue: 50,
    allowedGrades: ['Grade1'],
    usageLimit: 1,
    usageCount: 0
  },
  { 
    Code: 'AR2024002', 
    codeType: 'Chapter', 
    codeGrade: 'Grade1',
    chapterName: 'الأدب في العصر الجاهلي', 
    chapterId: null,
    isUsed: false,
    isActive: true,
    codeValue: 50,
    allowedGrades: ['Grade1'],
    usageLimit: 1,
    usageCount: 0
  },
  { 
    Code: 'AR2024003', 
    codeType: 'Chapter', 
    codeGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية', 
    chapterId: null,
    isUsed: false,
    isActive: true,
    codeValue: 0,
    allowedGrades: ['Grade1'],
    usageLimit: 1,
    usageCount: 0
  },
  { 
    Code: 'AR2024004', 
    codeType: 'Chapter', 
    codeGrade: 'Grade2',
    chapterName: 'البلاغة العربية - التشبيه', 
    chapterId: null,
    isUsed: false,
    isActive: true,
    codeValue: 75,
    allowedGrades: ['Grade2'],
    usageLimit: 1,
    usageCount: 0
  },
  { 
    Code: 'AR2024005', 
    codeType: 'Chapter', 
    codeGrade: 'Grade2',
    chapterName: 'البلاغة العربية - التشبيه', 
    chapterId: null,
    isUsed: false,
    isActive: true,
    codeValue: 75,
    allowedGrades: ['Grade2'],
    usageLimit: 1,
    usageCount: 0
  },
  { 
    Code: 'AR2024006', 
    codeType: 'Chapter', 
    codeGrade: 'Grade1',
    chapterName: 'الأدب في العصر الجاهلي', 
    chapterId: null,
    isUsed: false,
    isActive: true,
    codeValue: 50,
    allowedGrades: ['Grade1'],
    usageLimit: 1,
    usageCount: 0
  },
  { 
    Code: 'AR2024007', 
    codeType: 'Chapter', 
    codeGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية', 
    chapterId: null,
    isUsed: false,
    isActive: true,
    codeValue: 0,
    allowedGrades: ['Grade1'],
    usageLimit: 1,
    usageCount: 0
  },
  { 
    Code: 'AR2024008', 
    codeType: 'Chapter', 
    codeGrade: 'Grade2',
    chapterName: 'البلاغة العربية - التشبيه', 
    chapterId: null,
    isUsed: false,
    isActive: true,
    codeValue: 75,
    allowedGrades: ['Grade2'],
    usageLimit: 1,
    usageCount: 0
  }
];

const samplePDFs = [
  {
    pdfName: 'ملخص الأدب الجاهلي',
    pdfLink: '/pdfs/adab-jahili-summary.pdf',
    pdfPhoto: '/images/pdf-adab.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'الأدب في العصر الجاهلي'
  },
  {
    pdfName: 'قواعد النحو العربي',
    pdfLink: '/pdfs/nahw-arabic.pdf',
    pdfPhoto: '/images/pdf-nahw.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية'
  },
  {
    pdfName: 'المبتدأ والخبر - شرح مفصل',
    pdfLink: '/pdfs/mubtada-khabar.pdf',
    pdfPhoto: '/images/pdf-nahw.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية'
  },
  {
    pdfName: 'كان وأخواتها - الأفعال الناقصة',
    pdfLink: '/pdfs/kana-wa-akhawatiha.pdf',
    pdfPhoto: '/images/pdf-nahw.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية'
  },
  {
    pdfName: 'إن وأخواتها - الحروف الناسخة',
    pdfLink: '/pdfs/inna-wa-akhawatiha.pdf',
    pdfPhoto: '/images/pdf-nahw.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية'
  },
  {
    pdfName: 'تدريبات شاملة على الجملة الاسمية',
    pdfLink: '/pdfs/tadribat-jumla-ismiyya.pdf',
    pdfPhoto: '/images/pdf-nahw.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية'
  },
  {
    pdfName: 'أوراق عمل النحو العربي',
    pdfLink: '/pdfs/awraq-amal-nahw.pdf',
    pdfPhoto: '/images/pdf-nahw.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية'
  },
  {
    pdfName: 'دليل البلاغة العربية',
    pdfLink: '/pdfs/balagha-guide.pdf',
    pdfPhoto: '/images/pdf-balagha.jpg',
    pdfStatus: 'Paid',
    pdfPrice: '30',
    pdfGrade: 'Grade2',
    chapterName: 'البلاغة العربية - التشبيه'
  },
  {
    pdfName: 'مذكرة الإعراب والتحليل',
    pdfLink: '/pdfs/e3rab-guide.pdf',
    pdfPhoto: '/images/pdf-e3rab.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية'
  },
  {
    pdfName: 'شرح المعلقات السبع',
    pdfLink: '/pdfs/mo3allaqat.pdf',
    pdfPhoto: '/images/pdf-mo3allaqat.jpg',
    pdfStatus: 'Paid',
    pdfPrice: '40',
    pdfGrade: 'Grade1',
    chapterName: 'الأدب في العصر الجاهلي'
  },
  {
    pdfName: 'أساليب البيان والمعاني',
    pdfLink: '/pdfs/bayan-ma3ani.pdf',
    pdfPhoto: '/images/pdf-bayan.jpg',
    pdfStatus: 'Paid',
    pdfPrice: '35',
    pdfGrade: 'Grade2',
    chapterName: 'البلاغة العربية - التشبيه'
  },
  {
    pdfName: 'تطبيقات نحوية شاملة',
    pdfLink: '/pdfs/nahw-applications.pdf',
    pdfPhoto: '/images/pdf-applications.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'النحو العربي - الجملة الاسمية'
  },
  {
    pdfName: 'تاريخ الأدب العربي',
    pdfLink: '/pdfs/adab-history.pdf',
    pdfPhoto: '/images/pdf-history.jpg',
    pdfStatus: 'Paid',
    pdfPrice: '45',
    pdfGrade: 'Grade2',
    chapterName: 'البلاغة العربية - التشبيه'
  },
  {
    pdfName: 'مجموعة قصائد مختارة',
    pdfLink: '/pdfs/selected-poems.pdf',
    pdfPhoto: '/images/pdf-poems.jpg',
    pdfStatus: 'Free',
    pdfPrice: '0',
    pdfGrade: 'Grade1',
    chapterName: 'الأدب في العصر الجاهلي'
  },
  {
    pdfName: 'دليل كتابة المقال الأدبي',
    pdfLink: '/pdfs/essay-writing.pdf',
    pdfPhoto: '/images/pdf-essay.jpg',
    pdfStatus: 'Paid',
    pdfPrice: '20',
    pdfGrade: 'Grade2',
    chapterName: 'البلاغة العربية - التشبيه'
  }
];

// Enhanced quiz creation function
async function createEnhancedQuizzes(chapters) {
  // Sample questions for different subjects
  const arabicGrammarQuestions = [
    {
      question: "ما هو تعريف المفعول به؟",
      answer1: "ما وقع عليه فعل الفاعل",
      answer2: "الذي قام بالفعل", 
      answer3: "ما دل على الزمان",
      answer4: "ما دل على المكان",
      correctAnswer: 0
    },
    {
      question: "أي من الجمل التالية تحتوي على مفعول به؟",
      answer1: "جاء الطالب",
      answer2: "قرأ أحمد الكتاب",
      answer3: "نام الولد",
      answer4: "ذهب المعلم",
      correctAnswer: 1
    },
    {
      question: "ما إعراب كلمة 'كتاباً' في جملة 'قرأ الطالب كتاباً'؟",
      answer1: "فاعل مرفوع",
      answer2: "مفعول به منصوب",
      answer3: "مبتدأ مرفوع",
      answer4: "خبر منصوب",
      correctAnswer: 1
    },
    {
      question: "علامة نصب المفعول به المفرد هي:",
      answer1: "الضمة",
      answer2: "الفتحة", 
      answer3: "الكسرة",
      answer4: "السكون",
      correctAnswer: 1
    },
    {
      question: "في أي حالة يُحذف المفعول به؟",
      answer1: "عندما يكون معلوماً من السياق",
      answer2: "لا يُحذف أبداً",
      answer3: "عندما يكون جمعاً",
      answer4: "عندما يكون مؤنثاً",
      correctAnswer: 0
    }
  ];

  const literatureQuestions = [
    {
      question: "من هو شاعر المعلقة الذهبية؟",
      answer1: "امرؤ القيس",
      answer2: "زهير بن أبي سلمى",
      answer3: "عنترة بن شداد",
      answer4: "طرفة بن العبد",
      correctAnswer: 0
    },
    {
      question: "ما هو البحر الشعري الأكثر استخداماً في الشعر الجاهلي؟",
      answer1: "البسيط",
      answer2: "الطويل",
      answer3: "الكامل", 
      answer4: "الوافر",
      correctAnswer: 1
    },
    {
      question: "أي من هذه الصفات تميز الشعر الجاهلي؟",
      answer1: "البساطة في التعبير",
      answer2: "قوة الأسلوب والفخر",
      answer3: "التصوف والزهد",
      answer4: "الغزل العذري",
      correctAnswer: 1
    },
    {
      question: "ما معنى 'المعلقات' في الأدب الجاهلي؟",
      answer1: "القصائد المعلقة على الكعبة",
      answer2: "الشعر المنقوش على الذهب",
      answer3: "القصائد الطويلة المشهورة",
      answer4: "كل ما سبق صحيح",
      correctAnswer: 2
    },
    {
      question: "من أشهر شعراء الغزل في العصر الجاهلي؟",
      answer1: "امرؤ القيس",
      answer2: "عنترة بن شداد",
      answer3: "زهير بن أبي سلمى",
      answer4: "الأعشى",
      correctAnswer: 0
    }
  ];

  const rhetoricQuestions = [
    {
      question: "ما هو التشبيه؟",
      answer1: "مقارنة بين شيئين",
      answer2: "بيان وجه الشبه بين المشبه والمشبه به",
      answer3: "ذكر شيء واحد فقط",
      answer4: "التضاد بين شيئين",
      correctAnswer: 1
    },
    {
      question: "أركان التشبيه هي:",
      answer1: "المشبه والمشبه به فقط",
      answer2: "المشبه والمشبه به وأداة التشبيه",
      answer3: "المشبه والمشبه به وأداة التشبيه ووجه الشبه",
      answer4: "وجه الشبه فقط",
      correctAnswer: 2
    },
    {
      question: "أي من هذه أمثلة على الاستعارة؟",
      answer1: "الرجل كالأسد",
      answer2: "رأيت أسداً يقاتل",
      answer3: "الرجل أسد",
      answer4: "الأسد ملك الغابة",
      correctAnswer: 1
    },
    {
      question: "الكناية هي:",
      answer1: "تشبيه مباشر",
      answer2: "قول يُراد به غير معناه الحقيقي",
      answer3: "لفظ يدل على معناه مع جواز إرادة المعنى الأصلي",
      answer4: "تكرار الكلمات",
      correctAnswer: 2
    },
    {
      question: "ما الفرق بين التشبيه والاستعارة؟",
      answer1: "لا فرق بينهما",
      answer2: "التشبيه يذكر المشبه والمشبه به، الاستعارة تحذف أحدهما",
      answer3: "الاستعارة أوضح",
      answer4: "التشبيه أقوى في التأثير",
      correctAnswer: 1
    }
  ];

  const quizzes = [];

  // Create quizzes for each chapter
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
    
    // 1. Free Quiz (basic level)
    quizzes.push({
      quizName: `اختبار مجاني: ${chapter.chapterName} - المستوى الأساسي`,
      Grade: grade,
      timeOfQuiz: 15,
      questionsCount: 5,
      Questions: questionSet.slice(0, 5),
      isQuizActive: true,
      permissionToShow: true,
      prepaidStatus: false,
      quizPrice: 0
    });

    // 2. Paid Quiz (intermediate level)
    quizzes.push({
      quizName: `اختبار متقدم: ${chapter.chapterName} - المستوى المتوسط`,
      Grade: grade,
      timeOfQuiz: 25,
      questionsCount: 10,
      Questions: [...questionSet, ...questionSet.slice(0, 5)],
      isQuizActive: true,
      permissionToShow: true,
      prepaidStatus: true,
      quizPrice: 15
    });

    // 3. Premium Quiz (advanced level)
    quizzes.push({
      quizName: `اختبار شامل: ${chapter.chapterName} - المستوى المتقدم`,
      Grade: grade,
      timeOfQuiz: 40,
      questionsCount: 20,
      Questions: [...questionSet, ...questionSet, ...questionSet, ...questionSet].slice(0, 20),
      isQuizActive: true,
      permissionToShow: true,
      prepaidStatus: true,
      quizPrice: 25
    });
  });

  // Add general quizzes
  const generalQuizzes = [
    {
      quizName: "اختبار عام في النحو العربي - مجاني",
      Grade: "Grade1",
      timeOfQuiz: 20,
      questionsCount: 8,
      Questions: [...arabicGrammarQuestions, ...arabicGrammarQuestions.slice(0, 3)],
      isQuizActive: true,
      permissionToShow: true,
      prepaidStatus: false,
      quizPrice: 0
    },
    {
      quizName: "اختبار شامل في الأدب الجاهلي",
      Grade: "Grade1",
      timeOfQuiz: 35,
      questionsCount: 15,
      Questions: [...literatureQuestions, ...literatureQuestions, ...literatureQuestions],
      isQuizActive: true,
      permissionToShow: true,
      prepaidStatus: true,
      quizPrice: 20
    },
    {
      quizName: "تحدي البلاغة العربية - مجاني",
      Grade: "Grade2",
      timeOfQuiz: 25,
      questionsCount: 10,
      Questions: [...rhetoricQuestions, ...rhetoricQuestions],
      isQuizActive: true,
      permissionToShow: true,
      prepaidStatus: false,
      quizPrice: 0
    },
    {
      quizName: "اختبار تجريبي مفتوح - الصف الثاني",
      Grade: "Grade2",
      timeOfQuiz: 30,
      questionsCount: 12,
      Questions: [...arabicGrammarQuestions, ...literatureQuestions.slice(0, 2)],
      isQuizActive: true,
      permissionToShow: true,
      prepaidStatus: false,
      quizPrice: 0
    },
    {
      quizName: "مراجعة سريعة - مجاني",
      Grade: "Grade3",
      timeOfQuiz: 10,
      questionsCount: 4,
      Questions: arabicGrammarQuestions.slice(0, 4),
      isQuizActive: true,
      permissionToShow: true,
      prepaidStatus: false,
      quizPrice: 0
    }
  ];

  quizzes.push(...generalQuizzes);

  // Insert all quizzes
  const insertedQuizzes = await Quiz.insertMany(quizzes);
  
  return insertedQuizzes;
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Chapter.deleteMany({});
    await Quiz.deleteMany({});
    await Code.deleteMany({});
    await PDFs.deleteMany({});
    await Card.deleteMany({});
    
    console.log('Cleared existing data');

    // Hash passwords for users
    for (let user of sampleUsers) {
      user.Password = await bcrypt.hash(user.PasswordWithOutHash, 10);
    }

    // Insert data
    const insertedUsers = await User.insertMany(sampleUsers);
    console.log(`Inserted ${insertedUsers.length} users`);

    const insertedChapters = await Chapter.insertMany(sampleChapters);
    console.log(`Inserted ${insertedChapters.length} chapters`);

    // Create enhanced quizzes using the quiz seed data
    console.log('Creating enhanced quizzes...');
    const quizzes = await createEnhancedQuizzes(insertedChapters);
    console.log(`Inserted ${quizzes.length} enhanced quizzes and exams`);

    // First, update sample codes with actual chapter IDs before inserting
    for (let code of sampleCodes) {
      if (code.codeType === 'Chapter') {
        const relatedChapter = insertedChapters.find(chapter => chapter.chapterName === code.chapterName);
        if (relatedChapter) {
          code.chapterId = relatedChapter._id;
        }
      }
    }

    const insertedCodes = await Code.insertMany(sampleCodes);
    console.log(`Inserted ${insertedCodes.length} access codes`);

    // Link PDFs to chapters
    for (let i = 0; i < samplePDFs.length; i++) {
      const pdf = samplePDFs[i];
      
      // Find the corresponding chapter
      const relatedChapter = insertedChapters.find(chapter => chapter.chapterName === pdf.chapterName);
      if (relatedChapter) {
        pdf.chapterId = relatedChapter._id;
      }
    }

    const insertedPDFs = await PDFs.insertMany(samplePDFs);
    console.log(`Inserted ${insertedPDFs.length} PDFs`);

    // Update users with video info for each chapter
    for (let chapter of insertedChapters) {
      const usersOfGrade = insertedUsers.filter(user => user.Grade === chapter.chapterGrade && !user.isTeacher);
      
      for (let user of usersOfGrade) {
        // Add lectures
        chapter.chapterLectures.forEach(lecture => {
          user.videosInfo.push({
            _id: lecture._id,
            videoName: lecture.videoName,
            fristWatch: null,
            lastWatch: null,
            videoAllowedAttemps: 3,
            numberOfWatches: 0,
            videoPurchaseStatus: lecture.paymentStatus === 'Free',
            isUserEnterQuiz: false,
            isHWIsUploaded: false,
            isUserUploadPerviousHWAndApproved: false
          });
        });

        // Add summaries
        chapter.chapterSummaries.forEach(summary => {
          user.videosInfo.push({
            _id: summary._id,
            videoName: summary.videoName,
            fristWatch: null,
            lastWatch: null,
            videoAllowedAttemps: 3,
            numberOfWatches: 0,
            videoPurchaseStatus: summary.paymentStatus === 'Free',
            isUserEnterQuiz: false,
            isHWIsUploaded: false,
            isUserUploadPerviousHWAndApproved: false
          });
        });

        // Add solvings
        chapter.chapterSolvings.forEach(solving => {
          user.videosInfo.push({
            _id: solving._id,
            videoName: solving.videoName,
            fristWatch: null,
            lastWatch: null,
            videoAllowedAttemps: 3,
            numberOfWatches: 0,
            videoPurchaseStatus: solving.paymentStatus === 'Free',
            isUserEnterQuiz: false,
            isHWIsUploaded: false,
            isUserUploadPerviousHWAndApproved: false
          });
        });

        await user.save();
      }
    }

    // Create some sample attendance cards
    const sampleCards = insertedUsers.filter(user => !user.isTeacher).map(user => ({
      cardId: `CARD_${user.Code}`,
      userCode: user.Code.toString(),
      userId: user._id.toString(),
      cardHistory: []
    }));

    await Card.insertMany(sampleCards);
    console.log(`Inserted ${sampleCards.length} cards`);

    console.log('Database seeding completed successfully!');
    console.log('\n=== Sample Login Credentials ===');
    console.log('Teacher:');
    console.log('  Phone: 01111111111');
    console.log('  Password: teacher123');
    console.log('\nStudents:');
    console.log('  Phone: 01012345678, Password: password123 (أحمد محمد علي)');
    console.log('  Phone: 01123456789, Password: password123 (فاطمة أحمد محمود)');
    console.log('  Phone: 01234567890, Password: password123 (محمد عبد الرحمن)');
    console.log('\n=== Sample Access Codes ===');
    console.log('Chapters: AR2024001, AR2024002, AR2024003, AR2024004, AR2024005');
    console.log('Quizzes: QZ2024001, QZ2024002, QZ2024003');
    console.log('Videos: VID2024001, VID2024002');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  connectDB().then(() => {
    seedDatabase();
  });
}

module.exports = { seedDatabase, connectDB }; 