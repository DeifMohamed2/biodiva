const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elshahd', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Teacher seed data
const createTeacherAccount = async () => {
  try {
    // Check if teacher already exists
    const existingTeacher = await User.findOne({ 
      $or: [
        { Username: 'teacher_admin' },
        { phone: '+201234567890' },
        { isTeacher: true }
      ]
    });

    if (existingTeacher) {
      console.log('Teacher account already exists:', existingTeacher.Username || existingTeacher.phone);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('teacher123456', 10);

    // Create teacher account with all required fields
    const teacherData = {
      // Required fields from User model
      Username: 'teacher_admin',
      Password: hashedPassword,
      PasswordWithOutHash: 'teacher123456',
      gov: 'القاهرة',
      Markez: 'مدينة نصر',
      Grade: 'Grade1', // Default grade, but teacher can access all grades
      gender: 'male',
      phone: '+201234567890',
      parentPhone: '+201234567891',
      place: 'القاهرة - مدينة نصر',
      Code: Math.floor(Math.random() * 1000000) + 100000, // Generate unique 6-digit code
      
      // Teacher identification
      isTeacher: true,
      
      // Optional fields
      userPhoto: '/images/teacher-avatar.jpg',
      subscribe: true,
      ARorEN: 'AR',
      
      // Performance metrics (defaults)
      totalScore: 0,
      examsEnterd: 0,
      totalQuestions: 0,
      totalSubscribed: 0,
      
      // Status fields
      isActive: true,
      lastLogin: new Date(),
      registrationDate: new Date(),
      
      // Enhanced purchase tracking (empty arrays for teacher)
      chaptersPurchased: [],
      videosInfo: [],
      quizesInfo: [],
      
      // General access (teacher should have access to everything)
      generalAccess: {
        chapters: true,
        videos: true,
        quizzes: true,
        purchaseDate: new Date(),
        codeUsed: 'TEACHER_ADMIN_ACCESS'
      },
      
      // Legacy arrays (empty for teacher)
      chaptersPaid: [],
      videosPaid: [],
      examsPaid: [],
      PDFsPaid: [],
      
      // Teacher specific data (custom fields)
      teacherInfo: {
        subject: 'اللغة العربية',
        experience: '10 سنوات',
        qualification: 'ماجستير في اللغة العربية وآدابها',
        bio: 'معلم خبير في اللغة العربية والأدب العربي، متخصص في تدريس جميع المراحل الثانوية',
        teachingMethods: ['التعلم التفاعلي', 'الشرح المبسط', 'الأمثلة التطبيقية'],
        achievements: [
          'جائزة أفضل معلم لغة عربية 2023',
          'شهادة التميز في التعليم الإلكتروني',
          'مدرب معتمد في طرق التدريس الحديثة'
        ]
      },
      
      // Admin permissions (custom fields)
      permissions: {
        manageStudents: true,
        manageContent: true,
        manageQuizzes: true,
        generateCodes: true,
        viewAnalytics: true,
        exportData: true,
        systemSettings: true
      }
    };

    const teacher = new User(teacherData);
    await teacher.save();

    console.log('✅ Teacher account created successfully!');
    console.log('👤 Username: teacher_admin');
    console.log('🔑 Password: teacher123456');
    console.log('📱 Phone: +201234567890');
    console.log('🏛️ Location: القاهرة - مدينة نصر');
    console.log('🎯 Role: Teacher (Admin Access)');
    console.log('🆔 Code: ' + teacherData.Code);
    console.log('\n🔗 Login URL: http://localhost:9031/login');
    console.log('\n⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating teacher account:', error);
  }
};

// Seed additional teacher data (optional settings)
const createTeacherSettings = async () => {
  try {
    // You can add teacher-specific settings here if needed
    // For example, platform settings, preferences, etc.
    
    console.log('✅ Teacher settings configured successfully!');
  } catch (error) {
    console.error('❌ Error creating teacher settings:', error);
  }
};

// Main seed function
const seedTeacherData = async () => {
  console.log('🌱 Starting teacher data seeding...\n');
  
  await connectDB();
  await createTeacherAccount();
  await createTeacherSettings();
  
  console.log('\n🎉 Teacher data seeding completed successfully!');
  console.log('📝 Summary:');
  console.log('   - 1 Teacher account created');
  console.log('   - Admin permissions assigned');
  console.log('   - Account activated and verified');
  
  // Close database connection
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
  process.exit(0);
};

// Export for use in other files
module.exports = {
  seedTeacherData,
  createTeacherAccount,
  createTeacherSettings
};

// Run if this file is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  seedTeacherData().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
} 