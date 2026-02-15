const mongoose = require('mongoose');
const { required } = require('nodemon/lib/config');
const Schema = mongoose.Schema;

// Enhanced video info schema for better tracking
// Using days-based access system instead of watch counts
const VideoInfoSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    videoName: {
      type: String,
      required: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    videoType: {
      type: String,
      enum: ['lecture', 'summary', 'solving'],
      default: 'lecture',
    },
    fristWatch: {
      type: Date,
      default: null,
    },
    lastWatch: {
      type: Date,
      default: null,
    },
    // NEW: Days-based access system (replaces watch count system)
    accessDaysAllowed: {
      type: Number,
      default: 4, // Default 4 days access
    },
    accessStartDate: {
      type: Date,
      default: null, // Set when user first accesses video after purchase
    },
    accessExpiryDate: {
      type: Date,
      default: null, // Calculated: accessStartDate + accessDaysAllowed days
    },
    // LEGACY: Keep for backward compatibility during transition
    videoAllowedAttemps: {
      type: Number,
      default: 4, // Now represents days, not watches
    },
    numberOfWatches: {
      type: Number,
      default: 0,
    },
    hasWatched10Percent: {
      type: Boolean,
      default: false,
    },
    watchProgress: {
      type: Number,
      default: 0,
    },
    videoPurchaseStatus: {
      type: Boolean,
      default: false,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    purchaseCode: {
      type: String,
      default: null,
    },
    isUserEnterQuiz: {
      type: Boolean,
      default: false,
    },
    isHWIsUploaded: {
      type: Boolean,
      default: false,
    },
    isUserUploadPerviousHWAndApproved: {
      type: Boolean,
      default: false,
    },
    prerequisites: {
      type: String,
      enum: [
        'none',
        'WithExam',
        'WithHw',
        'WithExamaAndHw',
        'WithPreviousContent',
      ],
      default: 'none',
    },
    accessibleAfterViewing: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  { _id: false }
);

// Homework submission schema
const HomeworkSubmissionSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    videoId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentCode: {
      type: String,
      required: true,
    },
    files: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

// Schema for snapshot of a quiz question (stored when student takes quiz)
const QuestionSnapshotSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    questionPhoto: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    answer1: {
      type: String,
      required: true,
    },
    answer2: {
      type: String,
      required: true,
    },
    answer3: {
      type: String,
      default: '',
    },
    answer4: {
      type: String,
      default: '',
    },
    ranswer: {
      type: Number,
      required: true,
    },
    originalIndex: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// Enhanced quiz info schema
const QuizInfoSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    quizName: {
      type: String,
      required: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    // Quiz version at the time student took the quiz
    quizVersion: {
      type: Number,
      default: 1,
    },
    // Snapshot of questions shown to student (immutable after quiz completion)
    questionsSnapshot: {
      type: [QuestionSnapshotSchema],
      default: [],
    },
    isEnterd: {
      type: Boolean,
      default: false,
    },
    inProgress: {
      type: Boolean,
      default: false,
    },
    Score: {
      type: Number,
      default: 0,
    },
    answers: [
      {
        questionId: {
          type: String,
          required: true,
        },
        questionIndex: {
          type: Number,
          required: true,
        },
        selectedAnswer: {
          type: String,
          required: true,
        },
        answeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    randomQuestionIndices: {
      type: Array,
      default: [],
    },
    quizPurchaseStatus: {
      type: Boolean,
      default: false,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    purchaseCode: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    solvedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// Enhanced chapter purchase info schema
const ChapterPurchaseSchema = new Schema(
  {
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    chapterName: {
      type: String,
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    purchaseCode: {
      type: String,
      required: true,
    },
    purchasePrice: {
      type: Number,
      default: 0,
    },
    purchaseType: {
      type: String,
      enum: ['full_chapter', 'individual_videos'],
      default: 'full_chapter',
    },
    accessGranted: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    Username: {
      type: String,
      required: true,
    },
    Password: {
      type: String,
      required: true,
      unique: false,
    },
    PasswordWithOutHash: {
      type: String,
      required: true,
      unique: false,
    },
    gov: {
      type: String,
      required: true,
    },
    Markez: {
      type: String,
      required: true,
    },
    Grade: {
      type: String,
      required: true,
      enum: ['Grade1', 'Grade2', 'Grade3'], // Add more grades as needed
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female'],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    parentPhone: {
      type: String,
      required: true,
      unique: false,
    },
    place: {
      type: String,
      required: true,
      enum: ['online', 'center'],
      default: 'online',
    },
    Code: {
      type: Number,
      required: true,
      unique: true,
    },
    userPhoto: {
      type: String,
      required: false,
    },
    subscribe: {
      type: Boolean,
      required: true,
      default: true,
    },
    ARorEN: {
      type: String,
      enum: ['AR', 'EN'],
      default: 'AR',
    },

    // Enhanced purchase tracking
    chaptersPurchased: [ChapterPurchaseSchema],
    videosInfo: [VideoInfoSchema],
    quizesInfo: [QuizInfoSchema],
    homeworkSubmissions: [HomeworkSubmissionSchema],

    // Legacy arrays for backward compatibility
    chaptersPaid: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
      },
    ],
    videosPaid: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    examsPaid: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
      },
    ],
    PDFsPaid: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PDF',
      },
    ],

    

    isTeacher: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Performance metrics
    totalScore: {
      type: Number,
      required: true,
      default: 0,
    },
    examsEnterd: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    totalSubscribed: {
      type: Number,
      required: true,
      default: 0,
    },

    // User status and settings
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Instance methods for better user management
userSchema.methods.hasChapterAccess = function (chapterId) {
  return (
    this.chaptersPaid.includes(chapterId) ||
    this.chaptersPurchased.some(
      (purchase) => purchase.chapterId.toString() === chapterId.toString()
    )
  );
};

userSchema.methods.hasVideoAccess = function (videoId, video = null) {
  console.log('=== hasVideoAccess called ===');
  console.log('Checking access for videoId:', videoId);
  console.log('User videosPaid array:', this.videosPaid);
  console.log(
      'User videosInfo count:',
      this.videosInfo ? this.videosInfo.length : 0
    );

    // General access removed; require explicit entitlement

    // Ensure videosPaid is an array
  if (!this.videosPaid || !Array.isArray(this.videosPaid)) {
    this.videosPaid = [];
    console.log('Initialized videosPaid as empty array');
  }

  // Check if user has direct video access
  const hasDirectAccess =
    this.videosPaid.includes(videoId) ||
    this.videosPaid.includes(videoId.toString());

  console.log('Direct access check:', {
    includesVideoId: this.videosPaid.includes(videoId),
    includesVideoIdString: this.videosPaid.includes(videoId.toString()),
    hasDirectAccess: hasDirectAccess,
  });

  if (hasDirectAccess) {
    console.log('User has direct access to video');
    // Still need to check prerequisites
    if (video && video.prerequisites && video.prerequisites !== 'none') {
      return this.hasVideoPrerequisitesMet(video);
    }
    return true;
  }

  // Check if user has access through chapter purchase
  // Find the video info to get the chapter ID
  const videoInfo = this.videosInfo.find(
    (v) => v._id.toString() === videoId.toString()
  );
  console.log(
    'Video info found for chapter access check:',
    videoInfo ? 'Yes' : 'No'
  );

  if (videoInfo && videoInfo.chapterId) {
    const hasChapterAccess = this.hasChapterAccess(videoInfo.chapterId);
    console.log('Chapter access check result:', hasChapterAccess);
    if (hasChapterAccess) {
      // Still need to check prerequisites
      if (video && video.prerequisites && video.prerequisites !== 'none') {
        return this.hasVideoPrerequisitesMet(video);
      }
    }
    return hasChapterAccess;
  }

  console.log('No access found');
  return false;
};

// Method to check if user has access to a video through chapter purchase
userSchema.methods.hasVideoAccessThroughChapter = function (
  videoId,
  chapterId
) {
  return this.hasChapterAccess(chapterId);
};

// Method to check if video prerequisites are met
userSchema.methods.hasVideoPrerequisitesMet = function (video) {
  if (!video.prerequisites || video.prerequisites === 'none') {
    console.log('No prerequisites required');
    return true;
  }

  if (
    video.AccessibleAfterViewing &&
    video.AccessibleAfterViewing.toString().trim() !== ''
  ) {
    // Find the prerequisite video info in user's videosInfo
    const prerequisiteVideoInfo = this.videosInfo.find(
      (v) => v._id.toString() === video.AccessibleAfterViewing.toString()
    );

    console.log(
      'Prerequisite video info found:',
      prerequisiteVideoInfo ? 'Yes' : 'No'
    );

    if (prerequisiteVideoInfo) {
      let prerequisitesMet = true;

      if (video.prerequisites === 'WithExamaAndHw') {
        prerequisitesMet =
          prerequisiteVideoInfo.isUserEnterQuiz &&
          prerequisiteVideoInfo.isUserUploadPerviousHWAndApproved;
        console.log('WithExamaAndHw check:', {
          isUserEnterQuiz: prerequisiteVideoInfo.isUserEnterQuiz,
          isUserUploadPerviousHWAndApproved:
            prerequisiteVideoInfo.isUserUploadPerviousHWAndApproved,
          result: prerequisitesMet,
        });
      } else if (video.prerequisites === 'WithExam') {
        prerequisitesMet = prerequisiteVideoInfo.isUserEnterQuiz;
        console.log('WithExam check:', {
          isUserEnterQuiz: prerequisiteVideoInfo.isUserEnterQuiz,
          result: prerequisitesMet,
        });
      } else if (video.prerequisites === 'WithHw') {
        prerequisitesMet =
          prerequisiteVideoInfo.isUserUploadPerviousHWAndApproved;
        console.log('WithHw check:', {
          isUserUploadPerviousHWAndApproved:
            prerequisiteVideoInfo.isUserUploadPerviousHWAndApproved,
          result: prerequisitesMet,
        });
      }

      console.log('Prerequisites met:', prerequisitesMet);
      return prerequisitesMet;
    } else {
      console.log('Prerequisite video not found in user videosInfo');
      return false;
    }
  } else {
    console.log(
      'No AccessibleAfterViewing specified - checking current video requirements'
    );
    // If no specific prerequisite video is set, check if current video requirements are met
    const currentVideoInfo = this.videosInfo.find(
      (v) => v._id.toString() === video._id.toString()
    );

    if (currentVideoInfo) {
      let prerequisitesMet = true;

      if (video.prerequisites === 'WithExam') {
        prerequisitesMet = currentVideoInfo.isUserEnterQuiz;
        console.log('Current video WithExam check:', {
          isUserEnterQuiz: currentVideoInfo.isUserEnterQuiz,
          result: prerequisitesMet,
        });
      } else if (video.prerequisites === 'WithHw') {
        prerequisitesMet = currentVideoInfo.isUserUploadPerviousHWAndApproved;
        console.log('Current video WithHw check:', {
          isUserUploadPerviousHWAndApproved:
            currentVideoInfo.isUserUploadPerviousHWAndApproved,
          result: prerequisitesMet,
        });
      } else if (video.prerequisites === 'WithExamaAndHw') {
        prerequisitesMet =
          currentVideoInfo.isUserEnterQuiz &&
          currentVideoInfo.isUserUploadPerviousHWAndApproved;
        console.log('Current video WithExamaAndHw check:', {
          isUserEnterQuiz: currentVideoInfo.isUserEnterQuiz,
          isUserUploadPerviousHWAndApproved:
            currentVideoInfo.isUserUploadPerviousHWAndApproved,
          result: prerequisitesMet,
        });
      }

      console.log('Current video prerequisites met:', prerequisitesMet);
      return prerequisitesMet;
    } else {
      console.log('Current video info not found');
      return false;
    }
  }
};

// General access methods for checking if user has general access to content types
// General access methods removed

// Methods to grant general access
// General grant methods removed

userSchema.methods.hasGradeAccess = function (targetGrade) {
  return this.Grade === targetGrade;
};

userSchema.methods.canPurchaseContent = function (contentGrade) {
  return this.Grade === contentGrade;
};

userSchema.methods.addChapterPurchase = function (chapterData, code) {
  const purchase = {
    chapterId: chapterData._id,
    chapterName: chapterData.chapterName,
    purchaseCode: code,
    purchasePrice: chapterData.chapterPrice,
    purchaseType: 'full_chapter',
  };

  this.chaptersPurchased.push(purchase);

  // Add to legacy array for backward compatibility
  if (!this.chaptersPaid.includes(chapterData._id)) {
    this.chaptersPaid.push(chapterData._id);
  }

  return this.save();
};

userSchema.methods.addVideoPurchase = function (
  videoId,
  videoName,
  chapterId,
  code,
  accessDays = 4 // Default 4 days access
) {
  console.log('=== addVideoPurchase called ===');
  console.log('Parameters:', { videoId, videoName, chapterId, code, accessDays });
  console.log('User ID:', this._id);
  console.log(
    'Current videosPaid length:',
    this.videosPaid ? this.videosPaid.length : 'undefined'
  );

  const videoInfo = this.videosInfo.find(
    (v) => v._id.toString() === videoId.toString()
  );
  console.log('Video info found:', videoInfo ? 'Yes' : 'No');

  if (videoInfo) {
    videoInfo.videoPurchaseStatus = true;
    videoInfo.purchaseDate = new Date();
    videoInfo.purchaseCode = code;
    // Set access days - access will start when user first watches the video
    videoInfo.accessDaysAllowed = accessDays;
    videoInfo.videoAllowedAttemps = accessDays; // Legacy field for compatibility
    // Note: accessStartDate and accessExpiryDate are set when user first watches
    console.log('Updated video info with purchase status and access days:', accessDays);
  }

  // Ensure videosPaid is an array
  if (!this.videosPaid) {
    this.videosPaid = [];
    console.log('Initialized videosPaid as empty array');
  }

  // Convert videoId to ObjectId for consistent comparison
  const videoObjectId = new mongoose.Types.ObjectId(videoId);
  console.log('Converted videoId to ObjectId:', videoObjectId);

  // Add to legacy array for backward compatibility
  if (!this.videosPaid.includes(videoObjectId)) {
    this.videosPaid.push(videoObjectId);
    console.log(
      'Added video to videosPaid array. New length:',
      this.videosPaid.length
    );
  } else {
    console.log('Video already exists in videosPaid array');
  }

  this.totalSubscribed += 1;
  console.log('Incremented totalSubscribed to:', this.totalSubscribed);

  return this.save()
    .then((savedUser) => {
      console.log(
        'User saved successfully. Final videosPaid length:',
        savedUser.videosPaid.length
      );
      return savedUser;
    })
    .catch((error) => {
      console.error('Error saving user:', error);
      throw error;
    });
};

// Method to grant video access to chapter owners
userSchema.methods.grantVideoAccessToChapterOwners = async function (
  videoId,
  chapterId
) {
  const videoInfo = this.videosInfo.find(
    (v) => v._id.toString() === videoId.toString()
  );
  if (videoInfo) {
    videoInfo.videoPurchaseStatus = true;
    videoInfo.purchaseDate = new Date();
  }

  // Ensure videosPaid is an array
  if (!this.videosPaid) {
    this.videosPaid = [];
  }

  // Convert videoId to ObjectId for consistent comparison
  const videoObjectId = new mongoose.Types.ObjectId(videoId);

  // Add to legacy array for backward compatibility
  if (!this.videosPaid.includes(videoObjectId)) {
    this.videosPaid.push(videoObjectId);
  }

  return this.save();
};

// Video tracking method removed - tracking is now immediate on page entry

const User = mongoose.model('User', userSchema);

module.exports = User;
