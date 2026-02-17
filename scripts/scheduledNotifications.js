/**
 * Scheduled Notifications Service
 * 
 * This service runs scheduled tasks for:
 * 1. Video expiration alerts (runs every 6 hours)
 * 2. Can be extended for other scheduled notifications
 * 
 * Usage:
 *   node scripts/scheduledNotifications.js
 * 
 * Or add to package.json scripts:
 *   "notifications": "node scripts/scheduledNotifications.js"
 * 
 * For production, use PM2:
 *   pm2 start scripts/scheduledNotifications.js --name "biodiva-notifications"
 * 
 * @author Biodiva Team
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
require('dotenv').config();

// Import notification utilities
const { processExpirationNotifications, getExpirationReport } = require('../utils/videoExpirationNotifier');

// Database connection
const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/biodiva2025';

// Track sent notifications to avoid duplicates
const sentNotifications = new Set();

/**
 * Clear old entries from sentNotifications set (older than 24 hours)
 */
function clearOldNotificationTracking() {
  // Clear the set every 24 hours to prevent memory bloat
  sentNotifications.clear();
  console.log('🧹 Cleared notification tracking cache');
}

/**
 * Generate a unique key for a notification
 */
function getNotificationKey(studentId, videoId, date) {
  const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${studentId}_${videoId}_${dateKey}`;
}

/**
 * Run video expiration check and send notifications
 */
async function runVideoExpirationCheck() {
  console.log('\n' + '='.repeat(50));
  console.log(`🕐 Running video expiration check at ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(50));

  try {
    const result = await processExpirationNotifications({
      hoursThreshold: 24,
      onlyUnwatched: true,
      notifyParent: true,
      dryRun: false
    });

    console.log(`✅ Video expiration check completed`);
    console.log(`   📊 Processed: ${result.total} videos`);
    console.log(`   📱 Student notifications: ${result.studentNotifications.sent} sent`);
    console.log(`   👨‍👩‍👧 Parent notifications: ${result.parentNotifications.sent} sent`);
    
    return result;
  } catch (error) {
    console.error('❌ Error in video expiration check:', error);
    return null;
  }
}

/**
 * Run daily summary report
 */
async function runDailySummary() {
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Generating daily summary at ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(50));

  try {
    const report = await getExpirationReport(48); // Next 48 hours
    
    console.log(`\n📋 Upcoming Video Expirations (next 48 hours):`);
    console.log(`   Total expiring: ${report.totalExpiring}`);
    console.log(`   Unwatched: ${report.unwatchedCount} (need urgent notification)`);
    console.log(`   Already watched: ${report.watchedCount}`);
    
    if (report.unwatchedCount > 0) {
      console.log('\n⚠️ Unwatched videos expiring soon:');
      report.videos
        .filter(v => v.watches === 0)
        .slice(0, 10) // Show first 10
        .forEach(v => {
          console.log(`   - ${v.studentName}: "${v.videoName}" (${v.hoursRemaining}h remaining)`);
        });
    }
    
    return report;
  } catch (error) {
    console.error('❌ Error generating daily summary:', error);
    return null;
  }
}

/**
 * Initialize and start the scheduler
 */
async function startScheduler() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Biodiva Notification Scheduler Starting');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📅 Started at: ${new Date().toLocaleString('ar-EG')}`);
  
  // Connect to database
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Schedule video expiration check - every 6 hours
  // Runs at: 00:00, 06:00, 12:00, 18:00
  cron.schedule('0 */6 * * *', async () => {
    await runVideoExpirationCheck();
  }, {
    scheduled: true,
    timezone: 'Africa/Cairo'
  });
  console.log('⏰ Video expiration check scheduled: Every 6 hours');

  // Schedule daily summary - every day at 8 AM Cairo time
  cron.schedule('0 8 * * *', async () => {
    await runDailySummary();
  }, {
    scheduled: true,
    timezone: 'Africa/Cairo'
  });
  console.log('⏰ Daily summary scheduled: Every day at 8:00 AM (Cairo)');

  // Clear notification tracking cache - every 24 hours at midnight
  cron.schedule('0 0 * * *', () => {
    clearOldNotificationTracking();
  }, {
    scheduled: true,
    timezone: 'Africa/Cairo'
  });
  console.log('⏰ Cache cleanup scheduled: Every day at midnight');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All scheduled tasks are running');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Run initial check on startup
  console.log('🔄 Running initial checks...\n');
  await runVideoExpirationCheck();
  await runDailySummary();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down scheduler...');
  await mongoose.connection.close();
  console.log('📦 Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down scheduler...');
  await mongoose.connection.close();
  console.log('📦 Database connection closed');
  process.exit(0);
});

// Start the scheduler
startScheduler().catch(error => {
  console.error('❌ Failed to start scheduler:', error);
  process.exit(1);
});
