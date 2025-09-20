const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
    Grade: {
        type: String, 
        required: true,
        enum: ['Grade1', 'Grade2', 'Grade3']
    },
    CenterName: {
        type: String,
        required: true,
        enum: [
            'centerBasmala', 'centerDHL', 'centerDarElsa3da', 
            'centerFutureSoft', 'centerInfinity', 'centerElra3y', 
            'centerNewFuture', 'centerHarverd', 'centerA1'
        ]
    },
    Date: {
        type: String,
        required: true,
    },
    GroupTime: {
        type: String,
        required: true,
    },
    Students: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalStudents: {
        type: Number,
        default: 0
    },
    attendanceRate: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for better query performance
attendanceSchema.index({ Grade: 1, CenterName: 1, Date: 1, GroupTime: 1 });
attendanceSchema.index({ createdBy: 1, Date: 1 });

// Virtual for attendance rate calculation
attendanceSchema.virtual('calculatedAttendanceRate').get(function() {
    if (this.totalStudents === 0) return 0;
    return Math.round((this.Students.length / this.totalStudents) * 100);
});

// Method to add student to attendance
attendanceSchema.methods.addStudent = function(studentId) {
    // Get the ID from either ObjectId or populated object
    const getStudentId = (student) => student._id ? student._id.toString() : student.toString();
    
    // Check if student already exists
    const studentExists = this.Students.some(student => 
        getStudentId(student) === studentId.toString()
    );
    
    if (!studentExists) {
        this.Students.push(studentId);
        this.totalStudents = this.Students.length;
        return this.save();
    }
    return Promise.resolve(this);
};

// Method to remove student from attendance
attendanceSchema.methods.removeStudent = function(studentId) {
    // Get the ID from either ObjectId or populated object
    const getStudentId = (student) => student._id ? student._id.toString() : student.toString();
    
    // Filter out the student
    this.Students = this.Students.filter(student => 
        getStudentId(student) !== studentId.toString()
    );
    
    this.totalStudents = this.Students.length;
    return this.save();
};

// Static method to find attendance by criteria
attendanceSchema.statics.findByCriteria = function(grade, centerName, groupTime, date) {
    return this.findOne({
        Grade: grade,
        CenterName: centerName,
        GroupTime: groupTime,
        Date: date,
        isActive: true
    }).populate('Students', 'Username Code phone parentPhone Grade')
      .populate('createdBy', 'Username phone');
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;