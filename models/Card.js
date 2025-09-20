const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cardSchema = new Schema({
    cardId: {
        type: String, 
        required: true,
        unique: true
    },
    userCode: {
        type: String,
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cardHistory: [{
        action: {
            type: String,
            enum: ['assigned', 'used_for_attendance', 'removed'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        attendanceId: {
            type: Schema.Types.ObjectId,
            ref: 'Attendance'
        },
        notes: {
            type: String
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUsed: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Index for better query performance
cardSchema.index({ cardId: 1 });
cardSchema.index({ userCode: 1 });
cardSchema.index({ userId: 1 });

// Method to add history entry
cardSchema.methods.addHistoryEntry = function(action, attendanceId = null, notes = '') {
    this.cardHistory.push({
        action,
        attendanceId,
        notes,
        timestamp: new Date()
    });
    this.lastUsed = new Date();
    return this.save();
};

// Static method to find card by cardId or userCode
cardSchema.statics.findByCardOrCode = function(identifier) {
    return this.findOne({
        $or: [
            { cardId: identifier },
            { userCode: identifier }
        ],
        isActive: true
    }).populate('userId', 'Username Code phone parentPhone Grade');
};

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;