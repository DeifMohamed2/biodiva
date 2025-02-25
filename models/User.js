const mongoose = require('mongoose')
const Schema = mongoose.Schema


const quizAttemptSchema = new Schema(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'QuizBank',
      required: true,
    },
    quizName: {
      type: String,
      required: true,
    },
    isEnterd: {
      type: Boolean,
      default: false,
    },
    inProgress: {
      type: Boolean,
      default: false,
    },
    randomQuestions: {
      type: Array,
      required: false,
      default: [],
    },
    solvedAt: {
      type: Date,
      default: null,
    },
    solveTime: {
      type: Number,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    isQuizPrepaid: {
      type: Boolean,
      default: true,
    },
    quizPurchaseStatus: {
      type: Boolean,
      default: false,
    },
    answers: {
      type: Array,
      default: [],
    },
    questionsCount: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);
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
    PasswordWithOutHash : {
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
    },
    gender: {
        type: String,
        required: true,
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
    },

    quizesInfo: [quizAttemptSchema],
    
    videosInfo: {
        type: Array,
        required: true,
    },
    chaptersPaid: {
        type: Array,
        required: false,
    },
    videosPaid: {
        type: Array,
        required: false,
    },
    examsPaid: {
        type: Array,
        required: false,
    },
    PDFsPaid: {
        type: Array,
        required: false,
    },
    isTeacher: {
        type: Boolean,
        required: true,
    },
    totalScore: {
        type: Number,
        required: true
    },
    examsEnterd: {
        type: Number,
        required: true
    },
    totalQuestions:
    {
        type: Number,
        required: true
    },
    totalSubscribed: {
        type: Number,
        required: true
    },
    ARorEN: {
        type: String,
        required: true
    }



}, { timestamps: true });

const User = mongoose.model('User', userSchema)

module.exports = User;