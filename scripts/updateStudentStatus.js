#!/usr/bin/env node

/**
 * CLI Script to update student status based on card assignment and video watching
 * 
 * Usage:
 * node scripts/updateStudentStatus.js [options]
 * 
 * Options:
 * --dry-run              Run without making changes (preview mode)
 * --batch-size <number>  Number of students to process at once (default: 100)
 * --grade <grade>        Filter by specific grade (Grade1, Grade2, Grade3)
 * --status <status>      Filter by current status (online, center)
 * --help                 Show this help message
 */

const path = require('path');
const { updateStudentStatuses } = require('../utils/studentStatusScript');

function showHelp() {
    console.log(`
Student Status Update Script
============================

This script determines and updates student status based on:
1. Card assignment status
2. Video watching activity

Logic:
- Students with cards who haven't watched videos → Center
- Students without cards who haven't watched videos → Center  
- All other students → Online

Usage:
  node scripts/updateStudentStatus.js [options]

Options:
  --dry-run              Run without making changes (preview mode)
  --batch-size <number>  Number of students to process at once (default: 100)
  --grade <grade>        Filter by specific grade (Grade1, Grade2, Grade3)
  --status <status>      Filter by current status (online, center)
  --help                 Show this help message

Examples:
  node scripts/updateStudentStatus.js --dry-run
  node scripts/updateStudentStatus.js --grade Grade1 --batch-size 50
  node scripts/updateStudentStatus.js --status center --dry-run
`);
}

async function main() {
    const args = process.argv.slice(2);
    
    // Show help if requested
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--dry-run':
                options.dryRun = true;
                console.log('🔍 Running in DRY RUN mode - no changes will be made');
                break;
            case '--batch-size':
                options.batchSize = parseInt(args[i + 1]);
                if (isNaN(options.batchSize) || options.batchSize < 1) {
                    console.error('❌ Invalid batch size. Must be a positive number.');
                    process.exit(1);
                }
                i++;
                break;
            case '--grade':
                const grade = args[i + 1];
                if (!['Grade1', 'Grade2', 'Grade3'].includes(grade)) {
                    console.error('❌ Invalid grade. Must be Grade1, Grade2, or Grade3.');
                    process.exit(1);
                }
                options.gradeFilter = grade;
                i++;
                break;
            case '--status':
                const status = args[i + 1];
                if (!['online', 'center'].includes(status)) {
                    console.error('❌ Invalid status. Must be online or center.');
                    process.exit(1);
                }
                options.statusFilter = status;
                i++;
                break;
            default:
                if (args[i].startsWith('--')) {
                    console.error(`❌ Unknown option: ${args[i]}`);
                    console.log('Use --help for usage information.');
                    process.exit(1);
                }
        }
    }
    
    console.log('🚀 Starting Student Status Update Script');
    console.log('Options:', options);
    console.log('Time:', new Date().toISOString());
    console.log('=====================================\n');
    
    try {
        const result = await updateStudentStatuses(options);
        
        if (result.success) {
            console.log('\n✅ Script completed successfully!');
            console.log('📊 Final Results:');
            console.log(`   Total Students: ${result.stats.totalStudents}`);
            console.log(`   Center Students: ${result.stats.centerStudents}`);
            console.log(`   Online Students: ${result.stats.onlineStudents}`);
            console.log(`   Updated: ${result.stats.updated}`);
            console.log(`   Errors: ${result.stats.errors}`);
        } else {
            console.log('\n❌ Script failed:', result.error);
            process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 Script execution failed:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main };
