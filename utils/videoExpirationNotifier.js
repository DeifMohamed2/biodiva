/**
 * Video Expiration Notifier
 * 
 * This utility sends WhatsApp notifications to students when their video access
 * is about to expire (24 hours before) and they haven't watched it at least once.
 * 
 * Can be run as:
 * 1. Standalone script: node utils/videoExpirationNotifier.js
 * 2. Imported and called from a cron job
 * 
 * @author Biodiva Team
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models and utilities
let User, Chapter;
let wasender;

// Initialize models (for standalone execution)
async function initModels() {
  if (!User) {
    User = require('../models/User');
  }
  if (!Chapter) {
    Chapter = require('../models/Chapter');
  }
  if (!wasender) {
    wasender = require('./wasender');
  }
}

// Connect to database (for standalone execution)
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/biodiva2025';
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 Connected to MongoDB');
  }
}

/**
 * Format time remaining in Arabic
 * @param {number} hours - Hours remaining
 * @returns {string} - Formatted time in Arabic
 */
function formatTimeRemainingArabic(hours) {
  if (hours <= 1) {
    return 'أقل من ساعة';
  } else if (hours < 24) {
    return `${Math.round(hours)} ساعة`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days} يوم`;
  }
}

/**
 * Create video expiration warning message in Arabic
 * @param {Object} student - Student object
 * @param {Object} videoInfo - Video info from student's videosInfo
 * @param {number} hoursRemaining - Hours until expiration
 * @returns {string} - Formatted WhatsApp message
 */
function createExpirationWarningMessage(student, videoInfo, hoursRemaining) {
  const timeRemaining = formatTimeRemainingArabic(hoursRemaining);
  const expiryDate = new Date(videoInfo.accessExpiryDate);
  const dateOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const arabicExpiryDate = expiryDate.toLocaleDateString('ar-EG', dateOptions);

  const message = `━━━━━━━━━━━━━━━━━━━━━
⚠️ *تنبيه هام* ⚠️
━━━━━━━━━━━━━━━━━━━━━

السلام عليكم *${student.Username}* 👋

نود تنبيهك أن صلاحية الفيديو التالي ستنتهي قريباً:

━━━━ *تفاصيل الفيديو* ━━━━

📹 *اسم الفيديو:* ${videoInfo.videoName}
⏰ *الوقت المتبقي:* ${timeRemaining}
📅 *تاريخ انتهاء الصلاحية:* ${arabicExpiryDate}

━━━━ *حالة المشاهدة* ━━━━

${videoInfo.numberOfWatches > 0 
  ? `✅ *قمت بمشاهدة الفيديو* ${videoInfo.numberOfWatches} مرة`
  : `❌ *لم تقم بمشاهدة الفيديو بعد!*`
}

${videoInfo.numberOfWatches === 0 
  ? `\n🔴 *تحذير:* إذا لم تشاهد الفيديو قبل انتهاء الصلاحية، ستحتاج لشراء كود جديد!`
  : ''
}

━━━━━━━━━━━━━━━━━━━━━

📲 سارع بمشاهدة الفيديو الآن من خلال المنصة

مع تحيات،
*فريق Biodiva* 🧬
━━━━━━━━━━━━━━━━━━━━━`;

  return message;
}

/**
 * Create parent notification message in Arabic
 * @param {Object} student - Student object
 * @param {Object} videoInfo - Video info from student's videosInfo
 * @param {number} hoursRemaining - Hours until expiration
 * @returns {string} - Formatted WhatsApp message for parent
 */
function createParentExpirationMessage(student, videoInfo, hoursRemaining) {
  const timeRemaining = formatTimeRemainingArabic(hoursRemaining);
  const expiryDate = new Date(videoInfo.accessExpiryDate);
  const dateOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const arabicExpiryDate = expiryDate.toLocaleDateString('ar-EG', dateOptions);

  const message = `━━━━━━━━━━━━━━━━━━━━━
⚠️ *تنبيه لولي الأمر* ⚠️
━━━━━━━━━━━━━━━━━━━━━

السلام عليكم ورحمة الله وبركاته

نود إعلامكم أن صلاحية أحد الفيديوهات الخاصة بنجل/نجلتكم ستنتهي قريباً:

👤 *اسم الطالب:* ${student.Username}
📹 *اسم الفيديو:* ${videoInfo.videoName}
⏰ *الوقت المتبقي:* ${timeRemaining}
📅 *تاريخ الانتهاء:* ${arabicExpiryDate}

━━━━ *حالة المشاهدة* ━━━━

${videoInfo.numberOfWatches > 0 
  ? `✅ الطالب شاهد الفيديو ${videoInfo.numberOfWatches} مرة`
  : `❌ *الطالب لم يشاهد الفيديو بعد!*`
}

${videoInfo.numberOfWatches === 0 
  ? `\n🔴 *يُرجى تذكير الطالب بمشاهدة الفيديو قبل انتهاء الصلاحية*`
  : ''
}

━━━━━━━━━━━━━━━━━━━━━

مع تحيات،
*فريق Biodiva* 🧬
━━━━━━━━━━━━━━━━━━━━━`;

  return message;
}

/**
 * Find all videos expiring within the specified hours
 * @param {number} hoursThreshold - Hours threshold for expiration (default: 24)
 * @returns {Array} - Array of { student, videoInfo, hoursRemaining }
 */
async function findExpiringVideos(hoursThreshold = 24) {
  await initModels();
  
  const now = new Date();
  const thresholdTime = new Date(now.getTime() + (hoursThreshold * 60 * 60 * 1000));
  
  // Find all active students (not teachers)
  const students = await User.find({
    isTeacher: false,
    subscribe: true, // Only subscribed students
    'videosInfo.accessExpiryDate': { 
      $gte: now, // Not yet expired
      $lte: thresholdTime // Within threshold
    }
  }).lean();

  const expiringVideos = [];

  for (const student of students) {
    if (!student.videosInfo || !Array.isArray(student.videosInfo)) continue;

    for (const videoInfo of student.videosInfo) {
      // Skip if no expiry date set
      if (!videoInfo.accessExpiryDate) continue;

      const expiryDate = new Date(videoInfo.accessExpiryDate);
      
      // Check if within threshold
      if (expiryDate > now && expiryDate <= thresholdTime) {
        const hoursRemaining = (expiryDate - now) / (1000 * 60 * 60);
        
        expiringVideos.push({
          student,
          videoInfo,
          hoursRemaining: Math.round(hoursRemaining * 10) / 10 // Round to 1 decimal
        });
      }
    }
  }

  return expiringVideos;
}

/**
 * Find videos expiring within threshold that student hasn't watched
 * @param {number} hoursThreshold - Hours threshold for expiration (default: 24)
 * @returns {Array} - Array of { student, videoInfo, hoursRemaining }
 */
async function findUnwatchedExpiringVideos(hoursThreshold = 24) {
  const allExpiring = await findExpiringVideos(hoursThreshold);
  
  // Filter to only videos with 0 watches
  return allExpiring.filter(item => item.videoInfo.numberOfWatches === 0);
}

/**
 * Send expiration notification to a student
 * @param {Object} student - Student object
 * @param {Object} videoInfo - Video info object
 * @param {number} hoursRemaining - Hours until expiration
 * @param {boolean} notifyParent - Whether to also notify parent (default: true)
 * @returns {Object} - Result object with success status
 */
async function sendExpirationNotification(student, videoInfo, hoursRemaining, notifyParent = true) {
  await initModels();
  
  const results = {
    studentNotified: false,
    parentNotified: false,
    errors: []
  };

  // Send to student
  if (student.phone) {
    try {
      const studentMessage = createExpirationWarningMessage(student, videoInfo, hoursRemaining);
      const studentResult = await wasender.sendTextMessage(studentMessage, student.phone);
      results.studentNotified = studentResult.success;
      if (!studentResult.success) {
        results.errors.push(`Student notification failed: ${studentResult.message}`);
      }
    } catch (error) {
      results.errors.push(`Student notification error: ${error.message}`);
    }
  } else {
    results.errors.push('No student phone number');
  }

  // Send to parent if requested and unwatched
  if (notifyParent && student.parentPhone && videoInfo.numberOfWatches === 0) {
    try {
      const parentMessage = createParentExpirationMessage(student, videoInfo, hoursRemaining);
      const parentResult = await wasender.sendTextMessage(parentMessage, student.parentPhone);
      results.parentNotified = parentResult.success;
      if (!parentResult.success) {
        results.errors.push(`Parent notification failed: ${parentResult.message}`);
      }
    } catch (error) {
      results.errors.push(`Parent notification error: ${error.message}`);
    }
  }

  return results;
}

/**
 * Process all expiring videos and send notifications
 * @param {Object} options - Configuration options
 * @param {number} options.hoursThreshold - Hours before expiration to notify (default: 24)
 * @param {boolean} options.onlyUnwatched - Only notify for unwatched videos (default: true)
 * @param {boolean} options.notifyParent - Also notify parent for unwatched (default: true)
 * @param {boolean} options.dryRun - If true, don't actually send messages (default: false)
 * @returns {Object} - Summary of notifications sent
 */
async function processExpirationNotifications(options = {}) {
  const {
    hoursThreshold = 24,
    onlyUnwatched = true,
    notifyParent = true,
    dryRun = false
  } = options;

  await initModels();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔔 Video Expiration Notifier Starting...');
  console.log(`⏰ Checking for videos expiring within ${hoursThreshold} hours`);
  console.log(`📧 Only unwatched: ${onlyUnwatched}`);
  console.log(`👨‍👩‍👧 Notify parents: ${notifyParent}`);
  console.log(`🧪 Dry run: ${dryRun}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const expiringVideos = onlyUnwatched 
    ? await findUnwatchedExpiringVideos(hoursThreshold)
    : await findExpiringVideos(hoursThreshold);

  console.log(`\n📊 Found ${expiringVideos.length} videos to notify about\n`);

  const summary = {
    total: expiringVideos.length,
    studentNotifications: { sent: 0, failed: 0 },
    parentNotifications: { sent: 0, failed: 0 },
    details: []
  };

  for (const { student, videoInfo, hoursRemaining } of expiringVideos) {
    console.log(`\n👤 Student: ${student.Username}`);
    console.log(`   📹 Video: ${videoInfo.videoName}`);
    console.log(`   ⏰ Expires in: ${formatTimeRemainingArabic(hoursRemaining)}`);
    console.log(`   👁️ Watches: ${videoInfo.numberOfWatches}`);

    if (dryRun) {
      console.log('   ⏭️ Skipping (dry run)');
      summary.details.push({
        studentName: student.Username,
        videoName: videoInfo.videoName,
        hoursRemaining,
        status: 'skipped (dry run)'
      });
      continue;
    }

    const result = await sendExpirationNotification(
      student, 
      videoInfo, 
      hoursRemaining, 
      notifyParent
    );

    if (result.studentNotified) {
      summary.studentNotifications.sent++;
      console.log('   ✅ Student notified');
    } else {
      summary.studentNotifications.failed++;
      console.log('   ❌ Student notification failed');
    }

    if (notifyParent && videoInfo.numberOfWatches === 0) {
      if (result.parentNotified) {
        summary.parentNotifications.sent++;
        console.log('   ✅ Parent notified');
      } else {
        summary.parentNotifications.failed++;
        console.log('   ❌ Parent notification failed');
      }
    }

    summary.details.push({
      studentName: student.Username,
      videoName: videoInfo.videoName,
      hoursRemaining,
      studentNotified: result.studentNotified,
      parentNotified: result.parentNotified,
      errors: result.errors
    });

    // Add delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log(`   Total videos checked: ${summary.total}`);
  console.log(`   Student notifications: ${summary.studentNotifications.sent} sent, ${summary.studentNotifications.failed} failed`);
  console.log(`   Parent notifications: ${summary.parentNotifications.sent} sent, ${summary.parentNotifications.failed} failed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return summary;
}

/**
 * Get upcoming expirations report without sending notifications
 * @param {number} hoursThreshold - Hours threshold (default: 48)
 * @returns {Object} - Report of upcoming expirations
 */
async function getExpirationReport(hoursThreshold = 48) {
  await initModels();
  
  const expiringVideos = await findExpiringVideos(hoursThreshold);
  
  const report = {
    generatedAt: new Date(),
    hoursThreshold,
    totalExpiring: expiringVideos.length,
    unwatchedCount: expiringVideos.filter(v => v.videoInfo.numberOfWatches === 0).length,
    watchedCount: expiringVideos.filter(v => v.videoInfo.numberOfWatches > 0).length,
    videos: expiringVideos.map(({ student, videoInfo, hoursRemaining }) => ({
      studentName: student.Username,
      studentPhone: student.phone,
      parentPhone: student.parentPhone,
      videoName: videoInfo.videoName,
      watches: videoInfo.numberOfWatches,
      hoursRemaining: Math.round(hoursRemaining),
      expiryDate: videoInfo.accessExpiryDate
    }))
  };

  return report;
}

// Run as standalone script
async function main() {
  try {
    await connectDB();
    await initModels();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run') || args.includes('-d');
    const isReport = args.includes('--report') || args.includes('-r');
    const hours = args.find(a => a.startsWith('--hours='))?.split('=')[1] || 24;

    if (isReport) {
      console.log('📋 Generating expiration report...\n');
      const report = await getExpirationReport(parseInt(hours));
      console.log(JSON.stringify(report, null, 2));
    } else {
      await processExpirationNotifications({
        hoursThreshold: parseInt(hours),
        onlyUnwatched: true,
        notifyParent: true,
        dryRun: isDryRun
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  findExpiringVideos,
  findUnwatchedExpiringVideos,
  sendExpirationNotification,
  processExpirationNotifications,
  getExpirationReport,
  createExpirationWarningMessage,
  createParentExpirationMessage
};

// Run if called directly
if (require.main === module) {
  main();
}
