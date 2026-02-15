const mongoose = require('mongoose')
const { required } = require('nodemon/lib/config')
const Schema = mongoose.Schema

// Schema for individual question - ensures consistent structure
const QuestionSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    questionPhoto: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    answer1: {
        type: String,
        required: true
    },
    answer2: {
        type: String,
        required: true
    },
    answer3: {
        type: String,
        default: ''
    },
    answer4: {
        type: String,
        default: ''
    },
    ranswer: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    }
}, { _id: false });

const quizSchema = new Schema({
    quizName: {
        type: String, 
        required: true, 
    },
    // Version number - increments on each edit to track changes
    version: {
        type: Number,
        default: 1
    },
    // Timestamp of last version update
    versionUpdatedAt: {
        type: Date,
        default: Date.now
    },
    timeOfQuiz: {
        type: Number,
        required: true, 
    },
    questionsCount: {
        type: Number, 
        required: true, 
    },
    questionsToShow: {
        type: Number,
        default: function() {
            return this.questionsCount; // Default to showing all questions
        }
    },
    Questions: {
        type: [QuestionSchema],
        required: true, 
    },
    isQuizActive: {
        type: Boolean,
        required: true,
    },
    permissionToShow: {
        type: Boolean,
        required: true,
    },
    videoWillbeOpen: {
        type: String,
    },
    Grade: {
        type: String, 
        required: true,  
    },
    chapterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
        default: null
    },
    prepaidStatus: {
        type: Boolean,
        required: true
    },
    quizPrice: {
        type: Number,
        default: 0
    },
    showAnswersAfterQuiz: {
        type: Boolean,
        default: true
    }
}, {timestamps: true});

const Quiz = mongoose.model('Quiz',quizSchema)

module.exports=Quiz;