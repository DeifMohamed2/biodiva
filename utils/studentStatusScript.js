const mongoose = require('mongoose');
const User = require('../models/User');
const Card = require('../models/Card');
const Chapter = require('../models/Chapter');

// Database connection
const dbURI =
  'mongodb+srv://deif:1qaz2wsx@3devway.aa4i6ga.mongodb.net/biodiva2025?retryWrites=true&w=majority&appName=Cluster0';

// Configure mongoose for better performance
mongoose.set('bufferCommands', false);

/**
 * Script to determine and update student status based on:
 * 1. Card assignment
 * 2. Video watching activity
 *
 * Logic:
 * - If student has card assigned AND hasn't watched any videos → Center student
 * - If student has no card assigned AND hasn't watched any videos → Center student
 * - Otherwise → Online student
 */

class StudentStatusManager {
  constructor() {
    this.stats = {
      totalStudents: 0,
      centerStudents: 0,
      onlineStudents: 0,
      updated: 0,
      errors: 0,
    };
  }

  /**
   * Check if student has watched any videos
   * @param {Object} user - User document
   * @returns {boolean} - True if student has watched videos
   */
  hasWatchedVideos(user) {
    if (!user.videosInfo || user.videosInfo.length === 0) {
      return false;
    }

    // A student should be considered as having "watched" if any of the
    // following are true for any videoInfo entry:
    // - hasWatched10Percent === true
    // - numberOfWatches > 0 (legacy / incremental counting)
    // - watchProgress >= 10
    // - fristWatch or lastWatch is set
    return user.videosInfo.some((video) => {
      try {
        if (!video) return false;
        if (video.hasWatched10Percent === true) return true;
        if (
          typeof video.numberOfWatches === 'number' &&
          video.numberOfWatches > 0
        )
          return true;
        if (
          typeof video.watchProgress === 'number' &&
          video.watchProgress >= 10
        )
          return true;
        if (video.fristWatch) return true;
        if (video.lastWatch) return true;
        return false;
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * Check if student has a card assigned
   * @param {Object} user - User document
   * @returns {Promise<boolean>} - True if student has active card
   */
  async hasAssignedCard(user) {
    try {
      const card = await Card.findOne({
        userId: user._id,
        isActive: true,
      }).maxTimeMS(10000);
      return !!card;
    } catch (error) {
      console.error(`Error checking card for user ${user._id}:`, error);
      return false;
    }
  }

  /**
   * Determine student status based on card assignment and video watching
   * @param {Object} user - User document
   * @returns {Promise<string>} - 'center' or 'online'
   */
  async determineStudentStatus(user) {
    const hasCard = await this.hasAssignedCard(user);
    const hasWatchedVideos = this.hasWatchedVideos(user);

    console.log(`Student ${user.Username} (${user._id}):`, {
      hasCard,
      hasWatchedVideos,
      currentPlace: user.place,
    });

    // Logic based on requirements:
    // 1. If student has card AND hasn't watched videos → Center
    // 2. If student has no card AND hasn't watched videos → Center
    // 3. Otherwise → Online
    if (!hasWatchedVideos) {
      return 'center';
    } else {
      return 'online';
    }
  }

  /**
   * Update student status for a single user
   * @param {Object} user - User document
   * @returns {Promise<Object>} - Update result
   */
  async updateStudentStatus(user) {
    try {
      const newStatus = await this.determineStudentStatus(user);

      if (user.place !== newStatus) {
        await User.findByIdAndUpdate(user._id, { place: newStatus });
        console.log(
          `Updated ${user.Username} from ${user.place} to ${newStatus}`
        );
        return {
          success: true,
          updated: true,
          oldStatus: user.place,
          newStatus,
        };
      } else {
        console.log(
          `${user.Username} already has correct status: ${newStatus}`
        );
        // always return `newStatus` for consistent downstream handling
        return { success: true, updated: false, newStatus };
      }
    } catch (error) {
      console.error(`Error updating student ${user._id}:`, error);
      this.stats.errors++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Process all students and update their status
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing results
   */
  async processAllStudents(options = {}) {
    const {
      batchSize = 100,
      dryRun = false,
      gradeFilter = null,
      statusFilter = null,
    } = options;

    console.log('Starting student status update process...');
    console.log('Options:', { batchSize, dryRun, gradeFilter, statusFilter });

    try {
      // Build query
      const query = { isTeacher: false };
      if (gradeFilter) {
        query.Grade = gradeFilter;
      }
      if (statusFilter) {
        query.place = statusFilter;
      }

      // Get total count with timeout
      this.stats.totalStudents = await User.countDocuments(query).maxTimeMS(
        30000
      );
      console.log(`Found ${this.stats.totalStudents} students to process`);

      // Process in batches
      let skip = 0;
      let processed = 0;

      while (skip < this.stats.totalStudents) {
        console.log(
          `Processing batch: ${skip + 1} to ${Math.min(
            skip + batchSize,
            this.stats.totalStudents
          )}`
        );

        const students = await User.find(query)
          .skip(skip)
          .limit(batchSize)
          .lean()
          .maxTimeMS(30000);

        for (const student of students) {
          processed++;

          if (dryRun) {
            const newStatus = await this.determineStudentStatus(student);
            console.log(
              `[DRY RUN] Student ${student.Username}: ${student.place} → ${newStatus}`
            );

            if (newStatus === 'center') this.stats.centerStudents++;
            if (newStatus === 'online') this.stats.onlineStudents++;
          } else {
            const result = await this.updateStudentStatus(student);
            if (result.success && result.updated) {
              this.stats.updated++;
            }

            if (result.newStatus === 'center') this.stats.centerStudents++;
            if (result.newStatus === 'online') this.stats.onlineStudents++;
          }
        }

        skip += batchSize;

        // Add small delay to prevent overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log('Processing completed!');
      console.log('Final Stats:', this.stats);

      return {
        success: true,
        stats: this.stats,
        processed,
      };
    } catch (error) {
      console.error('Error in processAllStudents:', error);
      return {
        success: false,
        error: error.message,
        stats: this.stats,
      };
    }
  }

  /**
   * Get detailed statistics about student statuses
   * @returns {Promise<Object>} - Statistics
   */
  async getStudentStatusStats() {
    try {
      console.log('Getting student status statistics...');

      // Use simpler queries with better timeout settings
      const placeStats = await User.aggregate([
        { $match: { isTeacher: false } },
        {
          $group: {
            _id: '$place',
            count: { $sum: 1 },
          },
        },
      ]).option({ maxTimeMS: 30000 });

      const cardStats = await Card.aggregate([
        {
          $group: {
            _id: '$isActive',
            count: { $sum: 1 },
          },
        },
      ]).option({ maxTimeMS: 30000 });

      // Simplified video watching stats
      const totalStudents = await User.countDocuments({ isTeacher: false });
      const studentsWithVideos = await User.countDocuments({
        isTeacher: false,
        'videosInfo.0': { $exists: true },
      });

      return {
        placeDistribution: placeStats,
        cardStats: cardStats,
        totalStudents: totalStudents,
        studentsWithVideos: studentsWithVideos,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { error: error.message };
    }
  }
}

/**
 * Main function to run the student status update
 * @param {Object} options - Options for the update process
 */
async function updateStudentStatuses(options = {}) {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Database connected successfully!');

    const manager = new StudentStatusManager();

    console.log('=== Student Status Update Script ===');
    console.log('Starting at:', new Date().toISOString());

    // Get initial stats
    const initialStats = await manager.getStudentStatusStats();
    console.log('Initial Stats:', initialStats);

    // Process students
    const result = await manager.processAllStudents(options);

    // Get final stats
    const finalStats = await manager.getStudentStatusStats();
    console.log('Final Stats:', finalStats);

    console.log('Script completed at:', new Date().toISOString());
    return result;
  } catch (error) {
    console.error('Script execution failed:', error);
    return { success: false, error: error.message };
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Database disconnected');
  }
}

/**
 * CLI function for running the script
 */
async function runFromCLI() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[i + 1]) || 100;
        i++;
        break;
      case '--grade':
        options.gradeFilter = args[i + 1];
        i++;
        break;
      case '--status':
        options.statusFilter = args[i + 1];
        i++;
        break;
    }
  }

  console.log('Running with options:', options);
  await updateStudentStatuses(options);
}

// Export for use in other modules
module.exports = {
  StudentStatusManager,
  updateStudentStatuses,
  runFromCLI,
};

// Run if called directly
if (require.main === module) {
  runFromCLI()
    .then(() => {
      console.log('Script execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}
