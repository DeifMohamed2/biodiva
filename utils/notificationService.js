/**
 * Notification Service
 * 
 * Handles individual per-student notifications.
 * Only alerts students who have NOT watched their video (0 watches).
 * Spreads messages over time to prevent WhatsApp ban.
 * 
 * @author Biodiva Team
 */

const NotificationQueue = require('../models/NotificationQueue');
const User = require('../models/User');
const { sendTextMessage } = require('./wasender');

// Rate limiting: messages per hour and delay between messages
const MESSAGES_PER_HOUR = 60; // Max messages per hour
const MIN_DELAY_BETWEEN_MESSAGES = 60000; // 1 minute between messages (60 per hour)

/**
 * Format time remaining in Arabic
 */
function formatTimeRemainingArabic(hours) {
  if (hours <= 1) return 'أقل من ساعة';
  if (hours < 24) return `${Math.round(hours)} ساعة`;
  const days = Math.floor(hours / 24);
  return `${days} يوم`;
}

/**
 * Create video expiration message for student
 */
function createStudentExpirationMessage(studentName, videoName, hoursRemaining, watchCount, expiryDate) {
  const timeRemaining = formatTimeRemainingArabic(hoursRemaining);
  const dateOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const arabicExpiryDate = expiryDate.toLocaleDateString('ar-EG', dateOptions);

  return `━━━━━━━━━━━━━━━━━━━━━
⚠️ *تنبيه هام* ⚠️
━━━━━━━━━━━━━━━━━━━━━

السلام عليكم *${studentName}* 👋

نود تنبيهك أن صلاحية الفيديو التالي ستنتهي قريباً:

━━━━ *تفاصيل الفيديو* ━━━━

📹 *اسم الفيديو:* ${videoName}
⏰ *الوقت المتبقي:* ${timeRemaining}
📅 *تاريخ انتهاء الصلاحية:* ${arabicExpiryDate}

━━━━ *حالة المشاهدة* ━━━━

${watchCount > 0 
  ? `✅ *قمت بمشاهدة الفيديو* ${watchCount} مرة`
  : `❌ *لم تقم بمشاهدة الفيديو بعد!*`
}

${watchCount === 0 
  ? `\n🔴 *تحذير:* إذا لم تشاهد الفيديو قبل انتهاء الصلاحية، ستحتاج لشراء كود جديد!`
  : ''
}

━━━━━━━━━━━━━━━━━━━━━

📲 سارع بمشاهدة الفيديو الآن من خلال المنصة

مع تحيات،
*فريق Biodiva* 🧬
━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Create video expiration message for parent
 */
function createParentExpirationMessage(studentName, videoName, hoursRemaining, watchCount, expiryDate) {
  const timeRemaining = formatTimeRemainingArabic(hoursRemaining);
  const dateOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const arabicExpiryDate = expiryDate.toLocaleDateString('ar-EG', dateOptions);

  return `━━━━━━━━━━━━━━━━━━━━━
⚠️ *تنبيه لولي الأمر* ⚠️
━━━━━━━━━━━━━━━━━━━━━

السلام عليكم ورحمة الله وبركاته

نود إعلامكم أن صلاحية أحد الفيديوهات الخاصة بنجل/نجلتكم ستنتهي قريباً:

👤 *اسم الطالب:* ${studentName}
📹 *اسم الفيديو:* ${videoName}
⏰ *الوقت المتبقي:* ${timeRemaining}
📅 *تاريخ الانتهاء:* ${arabicExpiryDate}

━━━━ *حالة المشاهدة* ━━━━

${watchCount > 0 
  ? `✅ الطالب شاهد الفيديو ${watchCount} مرة`
  : `❌ *الطالب لم يشاهد الفيديو بعد!*`
}

${watchCount === 0 
  ? `\n🔴 *يُرجى تذكير الطالب بمشاهدة الفيديو قبل انتهاء الصلاحية*`
  : ''
}

━━━━━━━━━━━━━━━━━━━━━

مع تحيات،
*فريق Biodiva* 🧬
━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Schedule a notification for a student's video expiration
 * Call this when a student purchases or activates a video
 */
async function scheduleVideoExpirationNotification(student, videoInfo) {
  try {
    if (!videoInfo.accessExpiryDate) {
      return { success: false, message: 'No expiry date set' };
    }

    const notification = await NotificationQueue.scheduleVideoExpiration(student, videoInfo, 24);
    
    if (notification) {
      console.log(`📅 Scheduled notification for ${student.Username} - Video: ${videoInfo.videoName} at ${notification.scheduledFor}`);
      return { success: true, notification };
    }
    
    return { success: false, message: 'Notification time already passed' };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Process a single notification from the queue
 * ONLY sends if student has NOT watched the video (0 watches)
 */
async function processNotification(notification) {
  try {
    // Get fresh student data to check current watch count
    const student = await User.findById(notification.studentId).lean();
    if (!student) {
      notification.status = 'cancelled';
      notification.errorMessage = 'Student not found';
      await notification.save();
      return { success: false, reason: 'student_not_found', skipped: false };
    }

    // Find the video in student's videosInfo
    const videoInfo = student.videosInfo?.find(
      v => v._id.toString() === notification.contentId.toString()
    );

    if (!videoInfo) {
      notification.status = 'cancelled';
      notification.errorMessage = 'Video not found in student data';
      await notification.save();
      return { success: false, reason: 'video_not_found', skipped: false };
    }

    // Get current watch count
    const currentWatchCount = videoInfo.numberOfWatches || 0;

    // ⭐ ONLY send if student has NOT watched the video at all
    if (currentWatchCount > 0) {
      // Student already watched - no need to alert, cancel notification
      notification.status = 'cancelled';
      notification.errorMessage = `Student already watched ${currentWatchCount} time(s)`;
      notification.watchCount = currentWatchCount;
      await notification.save();
      console.log(`⏭️ [${student.Username}] Skipped - already watched ${currentWatchCount}x`);
      return { success: true, skipped: true, reason: 'already_watched', watchCount: currentWatchCount };
    }

    // Calculate hours remaining
    const now = new Date();
    const expiryDate = new Date(videoInfo.accessExpiryDate);
    const hoursRemaining = Math.max(0, (expiryDate - now) / (1000 * 60 * 60));

    // Check if already expired
    if (hoursRemaining <= 0) {
      notification.status = 'cancelled';
      notification.errorMessage = 'Video already expired';
      await notification.save();
      return { success: false, reason: 'expired', skipped: false };
    }

    // Send to student (only unwatched videos reach here)
    let studentSent = false;
    if (student.phone) {
      const studentMessage = createStudentExpirationMessage(
        student.Username,
        notification.contentName,
        hoursRemaining,
        0, // Always 0 watches at this point
        expiryDate
      );
      
      const result = await sendTextMessage(studentMessage, student.phone);
      studentSent = result.success;
      
      if (!result.success) {
        console.log(`⚠️ Failed to send to student ${student.Username}: ${result.message}`);
      }
    }

    // Send to parent (always for unwatched videos)
    let parentSent = false;
    if (student.parentPhone) {
      const parentMessage = createParentExpirationMessage(
        student.Username,
        notification.contentName,
        hoursRemaining,
        0, // Always 0 watches
        expiryDate
      );
      
      const result = await sendTextMessage(parentMessage, student.parentPhone);
      parentSent = result.success;
      
      if (!result.success) {
        console.log(`⚠️ Failed to send to parent of ${student.Username}: ${result.message}`);
      }
    }

    // Update notification status
    notification.status = studentSent ? 'sent' : 'failed';
    notification.sentAt = new Date();
    notification.parentNotified = parentSent;
    notification.watchCount = currentWatchCount;
    
    if (!studentSent) {
      notification.retryCount += 1;
      notification.errorMessage = 'Failed to send to student';
      
      // Allow up to 3 retries
      if (notification.retryCount < 3) {
        notification.status = 'pending';
        notification.scheduledFor = new Date(Date.now() + 30 * 60 * 1000); // Retry in 30 min
      }
    }
    
    await notification.save();

    console.log(`📨 [${student.Username}] Video: ${notification.contentName} - Student: ${studentSent ? '✅' : '❌'}, Parent: ${parentSent ? '✅' : '❌'}`);

    return { 
      success: studentSent || parentSent, 
      studentSent, 
      parentSent,
      watchCount: 0,
      skipped: false
    };
  } catch (error) {
    console.error(`Error processing notification ${notification._id}:`, error);
    notification.status = 'failed';
    notification.errorMessage = error.message;
    notification.retryCount += 1;
    
    if (notification.retryCount < 3) {
      notification.status = 'pending';
      notification.scheduledFor = new Date(Date.now() + 30 * 60 * 1000);
    }
    
    await notification.save();
    return { success: false, error: error.message, skipped: false };
  }
}

/**
 * Process due notifications with rate limiting
 * Only processes 1 notification per minute to spread over 1 hour (60/hour max)
 * This prevents WhatsApp ban from sending too many messages at once
 */
async function processDueNotifications() {
  try {
    // Get only ONE due notification at a time (rate limiting)
    const dueNotification = await NotificationQueue.findOne({
      status: 'pending',
      scheduledFor: { $lte: new Date() }
    }).sort({ scheduledFor: 1 });
    
    if (!dueNotification) {
      return { processed: 0, sent: 0, skipped: 0, failed: 0 };
    }

    // Process this single notification
    const result = await processNotification(dueNotification);
    
    const stats = {
      processed: 1,
      sent: result.success && !result.skipped ? 1 : 0,
      skipped: result.skipped ? 1 : 0,
      failed: !result.success && !result.skipped ? 1 : 0
    };

    // Log only when actually sending (not for skipped/cancelled)
    if (!result.skipped) {
      console.log(`📬 Notification: ${stats.sent ? '✅ Sent' : '❌ Failed'}`);
    }

    return stats;
  } catch (error) {
    console.error('Error processing notification:', error);
    return { processed: 0, sent: 0, skipped: 0, failed: 0, error: error.message };
  }
}

/**
 * Schedule notifications for all existing videos with expiry dates
 * Run this once on startup to catch any missing notifications
 * Only schedules for students who have NOT watched (0 watches)
 */
async function scheduleExistingVideoNotifications() {
  try {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find students with videos expiring in next 48 hours with 0 watches
    const students = await User.find({
      isTeacher: false,
      'videosInfo.accessExpiryDate': { 
        $gte: now,
        $lte: in48Hours
      }
    }).lean();

    let scheduled = 0;

    for (const student of students) {
      if (!student.videosInfo) continue;

      for (const videoInfo of student.videosInfo) {
        if (!videoInfo.accessExpiryDate) continue;
        
        // Only schedule for UNWATCHED videos (0 watches)
        if ((videoInfo.numberOfWatches || 0) > 0) continue;

        const expiryDate = new Date(videoInfo.accessExpiryDate);
        if (expiryDate > now && expiryDate <= in48Hours) {
          // Check if notification already exists
          const existing = await NotificationQueue.findOne({
            studentId: student._id,
            contentId: videoInfo._id,
            type: 'video_expiration',
            status: 'pending'
          });

          if (!existing) {
            await NotificationQueue.scheduleVideoExpiration(student, videoInfo, 24);
            scheduled++;
          }
        }
      }
    }

    if (scheduled > 0) {
      console.log(`📅 Scheduled ${scheduled} video expiration notification(s) for unwatched videos`);
    }

    return scheduled;
  } catch (error) {
    console.error('Error scheduling existing notifications:', error);
    return 0;
  }
}

/**
 * Get notification statistics
 */
async function getNotificationStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const [pending, sentToday, failedToday, total] = await Promise.all([
    NotificationQueue.countDocuments({ status: 'pending' }),
    NotificationQueue.countDocuments({ status: 'sent', sentAt: { $gte: today } }),
    NotificationQueue.countDocuments({ status: 'failed', updatedAt: { $gte: today } }),
    NotificationQueue.countDocuments({})
  ]);

  return { pending, sentToday, failedToday, total };
}

module.exports = {
  scheduleVideoExpirationNotification,
  processDueNotifications,
  scheduleExistingVideoNotifications,
  getNotificationStats,
  createStudentExpirationMessage,
  createParentExpirationMessage
};
