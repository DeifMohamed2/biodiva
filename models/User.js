const mongoose = require('mongoose')
const { required } = require('nodemon/lib/config')
const Schema = mongoose.Schema

// Enhanced video info schema for better tracking
const VideoInfoSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    videoName: {
        type: String,
        required: true
    },
    chapterId: {
        type: Schema.Types.ObjectId,
        ref: 'Chapter'
    },
    videoType: {
        type: String,
        enum: ['lecture', 'summary', 'solving'],
        default: 'lecture'
    },
    fristWatch: {
        type: Date,
        default: null
    },
    lastWatch: {
        type: Date,
        default: null
    },
    videoAllowedAttemps: {
        type: Number,
        default: 3
    },
    numberOfWatches: {
        type: Number,
        default: 0
    },
    videoPurchaseStatus: {
        type: Boolean,
        default: false
    },
    purchaseDate: {
        type: Date,
        default: null
    },
    purchaseCode: {
        type: String,
        default: null
    },
    isUserEnterQuiz: {
        type: Boolean,
        default: false
    },
    isHWIsUploaded: {
        type: Boolean,
        default: false
    },
    isUserUploadPerviousHWAndApproved: {
        type: Boolean,
        default: false
    },
    prerequisites: {
        type: String,
        enum: ['none', 'WithExam', 'WithHw', 'WithExamaAndHw', 'WithPreviousContent'],
        default: 'none'
    },
    accessibleAfterViewing: {
        type: Schema.Types.ObjectId,
        default: null
    }
}, { _id: false });

// Enhanced quiz info schema
const QuizInfoSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    quizName: {
        type: String,
        required: true
    },
    chapterId: {
        type: Schema.Types.ObjectId,
        ref: 'Chapter'
    },
    isEnterd: {
        type: Boolean,
        default: false
    },
    inProgress: {
        type: Boolean,
        default: false
    },
    Score: {
        type: Number,
        default: 0
    },
    answers: [{
        questionId: {
            type: String,
            required: true
        },
        questionIndex: {
            type: Number,
            required: true
        },
        selectedAnswer: {
            type: String,
            required: true
        },
        answeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    randomQuestionIndices: {
        type: Array,
        default: []
    },
    quizPurchaseStatus: {
        type: Boolean,
        default: false
    },
    purchaseDate: {
        type: Date,
        default: null
    },
    purchaseCode: {
        type: String,
        default: null
    },
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    solvedAt: {
        type: Date,
        default: null
    }
}, { _id: false });

// Enhanced chapter purchase info schema
const ChapterPurchaseSchema = new Schema({
    chapterId: {
        type: Schema.Types.ObjectId,
        ref: 'Chapter',
        required: true
    },
    chapterName: {
        type: String,
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    purchaseCode: {
        type: String,
        required: true
    },
    purchasePrice: {
        type: Number,
        default: 0
    },
    purchaseType: {
        type: String,
        enum: ['full_chapter', 'individual_videos'],
        default: 'full_chapter'
    },
    accessGranted: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const userSchema = new Schema({
    Username: {
        type: String,
        required: true
    },
    Password: {
        type: String,
        required: true,
        unique: false
    },
    PasswordWithOutHash: {
        type: String,
        required: true,
        unique: false
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
        enum: ['male', 'female']
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    parentPhone: {
        type: String,
        required: true,
        unique: false
    },
    place: {
        type: String,
        required: true,
    },
    Code: {
        type: Number,
        required: true,
        unique: true
    },
    userPhoto: {
        type: String,
        required: false,
    },
    subscribe: {
        type: Boolean,
        required: true,
        default: false
    },
    ARorEN: {
        type: String,
        enum: ['AR', 'EN'],
        default: 'AR'
    },

    // Enhanced purchase tracking
    chaptersPurchased: [ChapterPurchaseSchema],
    videosInfo: [VideoInfoSchema],
    quizesInfo: [QuizInfoSchema],
    

    
    // Legacy arrays for backward compatibility
    chaptersPaid: [{
        type: Schema.Types.ObjectId,
        ref: 'Chapter'
    }],
    videosPaid: [{
        type: Schema.Types.ObjectId
    }],
    examsPaid: [{
        type: Schema.Types.ObjectId,
        ref: 'Quiz'
    }],
    PDFsPaid: [{
        type: Schema.Types.ObjectId,
        ref: 'PDFs'
    }],
    
    isTeacher: {
        type: Boolean,
        required: true,
        default: false
    },
    
    // Performance metrics
    totalScore: {
        type: Number,
        required: true,
        default: 0
    },
    examsEnterd: {
        type: Number,
        required: true,
        default: 0
    },
    totalQuestions: {
        type: Number,
        required: true,
        default: 0
    },
    totalSubscribed: {
        type: Number,
        required: true,
        default: 0
    },
    
    // User status and settings
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Instance methods for better user management
userSchema.methods.hasChapterAccess = function(chapterId) {
    return this.chaptersPaid.includes(chapterId) ||
           this.chaptersPurchased.some(purchase => purchase.chapterId.toString() === chapterId.toString());
};

userSchema.methods.hasVideoAccess = function(videoId) {
    // Check if user has direct video access
    const hasDirectAccess = this.videosPaid.includes(videoId) || 
                           this.videosPaid.includes(videoId.toString());
    
    if (hasDirectAccess) {
        return true;
    }
    
    // Check if user has access through chapter purchase
    // Find the video info to get the chapter ID
    const videoInfo = this.videosInfo.find(v => v._id.toString() === videoId.toString());
    if (videoInfo && videoInfo.chapterId) {
        return this.hasChapterAccess(videoInfo.chapterId);
    }
    
    return false;
};

// Method to check if user has access to a video through chapter purchase
userSchema.methods.hasVideoAccessThroughChapter = function(videoId, chapterId) {
    return this.hasChapterAccess(chapterId);
};

// General access methods for checking if user has general access to content types
userSchema.methods.hasGeneralChapterAccess = function() {
    return false;
};

userSchema.methods.hasGeneralVideoAccess = function() {
    return false;
};

userSchema.methods.hasGeneralQuizAccess = function() {
    return false;
};

// Methods to grant general access
// userSchema.methods.grantGeneralChapterAccess = async function(code) {
//     this.generalAccess = this.generalAccess || {};
//     this.generalAccess.chapters = true;
//     this.generalAccess.purchaseDate = new Date();
//     this.generalAccess.codeUsed = code;
//     return await this.save();
// };

// userSchema.methods.grantGeneralVideoAccess = async function(code) {
//     this.generalAccess = this.generalAccess || {};
//     this.generalAccess.videos = true;
//     this.generalAccess.purchaseDate = new Date();
//     this.generalAccess.codeUsed = code;
//     return await this.save();
// };

// userSchema.methods.grantGeneralQuizAccess = async function(code) {
//     this.generalAccess = this.generalAccess || {};
//     this.generalAccess.quizzes = true;
//     this.generalAccess.purchaseDate = new Date();
//     this.generalAccess.codeUsed = code;
//     return await this.save();
// };

userSchema.methods.hasGradeAccess = function(targetGrade) {
    return this.Grade === targetGrade;
};

userSchema.methods.canPurchaseContent = function(contentGrade) {
    return this.Grade === contentGrade;
};

userSchema.methods.addChapterPurchase = function(chapterData, code) {
    const purchase = {
        chapterId: chapterData._id,
        chapterName: chapterData.chapterName,
        purchaseCode: code,
        purchasePrice: chapterData.chapterPrice,
        purchaseType: 'full_chapter'
    };
    
    this.chaptersPurchased.push(purchase);
    
    // Add to legacy array for backward compatibility
    if (!this.chaptersPaid.includes(chapterData._id)) {
        this.chaptersPaid.push(chapterData._id);
    }
    
    return this.save();
};

userSchema.methods.addVideoPurchase = function(videoId, videoName, chapterId, code) {
    const videoInfo = this.videosInfo.find(v => v._id.toString() === videoId.toString());
    if (videoInfo) {
        videoInfo.videoPurchaseStatus = true;
        videoInfo.purchaseDate = new Date();
        videoInfo.purchaseCode = code;
    }
    
    // Add to legacy array for backward compatibility
    if (!this.videosPaid.includes(videoId)) {
        this.videosPaid.push(videoId);
    }
    
    this.totalSubscribed += 1;
    return this.save();
};

// Method to grant video access to chapter owners
userSchema.methods.grantVideoAccessToChapterOwners = async function(videoId, chapterId) {
    const videoInfo = this.videosInfo.find(v => v._id.toString() === videoId.toString());
    if (videoInfo) {
        videoInfo.videoPurchaseStatus = true;
        videoInfo.purchaseDate = new Date();
    }
    
    // Add to legacy array for backward compatibility
    if (!this.videosPaid.includes(videoId)) {
        this.videosPaid.push(videoId);
    }
    
    return this.save();
};

const User = mongoose.model('User', userSchema)

module.exports = User;