const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Notification Queue Schema
 * Stores scheduled notifications to be sent at specific times
 * Each student gets their own individual notification based on their video expiry
 */
const NotificationQueueSchema = new Schema({
  // Type of notification
  type: {
    type: String,
    enum: ['video_expiration', 'quiz_reminder', 'homework_reminder', 'general'],
    required: true
  },
  
  // Student to notify
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Student phone
  studentPhone: {
    type: String,
    required: true
  },
  
  // Parent phone (optional)
  parentPhone: {
    type: String,
    default: null
  },
  
  // Student name for message
  studentName: {
    type: String,
    required: true
  },
  
  // Related content ID (video, quiz, etc.)
  contentId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  
  // Content name for message
  contentName: {
    type: String,
    required: true
  },
  
  // When to send this notification
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  
  // Content expiry date (for reference)
  expiryDate: {
    type: Date,
    default: null
  },
  
  // How many watches at time of scheduling
  watchCount: {
    type: Number,
    default: 0
  },
  
  // Status of notification
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // When was it actually sent
  sentAt: {
    type: Date,
    default: null
  },
  
  // Error message if failed
  errorMessage: {
    type: String,
    default: null
  },
  
  // Number of retry attempts
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Should we notify parent too?
  notifyParent: {
    type: Boolean,
    default: true
  },
  
  // Was parent notified?
  parentNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficiently finding due notifications
NotificationQueueSchema.index({ status: 1, scheduledFor: 1 });

// Index to prevent duplicate notifications
NotificationQueueSchema.index(
  { studentId: 1, contentId: 1, type: 1, status: 1 },
  { unique: false }
);

/**
 * Static method to schedule a video expiration notification
 */
NotificationQueueSchema.statics.scheduleVideoExpiration = async function(
  student,
  videoInfo,
  hoursBeforeExpiry = 24
) {
  // Calculate when to send (24 hours before expiry)
  const expiryDate = new Date(videoInfo.accessExpiryDate);
  const scheduledFor = new Date(expiryDate.getTime() - (hoursBeforeExpiry * 60 * 60 * 1000));
  
  // Don't schedule if already past
  if (scheduledFor <= new Date()) {
    return null;
  }
  
  // Check if notification already exists for this video
  const existing = await this.findOne({
    studentId: student._id,
    contentId: videoInfo._id,
    type: 'video_expiration',
    status: 'pending'
  });
  
  if (existing) {
    // Update scheduled time if expiry changed
    existing.scheduledFor = scheduledFor;
    existing.expiryDate = expiryDate;
    await existing.save();
    return existing;
  }
  
  // Create new notification
  return await this.create({
    type: 'video_expiration',
    studentId: student._id,
    studentPhone: student.phone,
    parentPhone: student.parentPhone,
    studentName: student.Username,
    contentId: videoInfo._id,
    contentName: videoInfo.videoName,
    scheduledFor,
    expiryDate,
    watchCount: videoInfo.numberOfWatches || 0,
    notifyParent: (videoInfo.numberOfWatches || 0) === 0
  });
};

/**
 * Static method to get all due notifications
 */
NotificationQueueSchema.statics.getDueNotifications = async function() {
  return await this.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() }
  }).sort({ scheduledFor: 1 });
};

/**
 * Static method to cancel notifications for a video
 */
NotificationQueueSchema.statics.cancelVideoNotifications = async function(studentId, videoId) {
  return await this.updateMany(
    {
      studentId,
      contentId: videoId,
      status: 'pending'
    },
    {
      $set: { status: 'cancelled' }
    }
  );
};

const NotificationQueue = mongoose.model('NotificationQueue', NotificationQueueSchema);

module.exports = NotificationQueue;
