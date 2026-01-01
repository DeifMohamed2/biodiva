#!/usr/bin/env node

/**
 * Script to convert all Video codes to GeneralVideo codes
 * 
 * This script:
 * - Finds all codes with codeType === 'Video'
 * - Converts them to codeType === 'GeneralVideo'
 * - Sets isGeneralCode to true
 * - Removes chapterId, contentId, and contentName fields
 * 
 * Usage:
 *   node scripts/convertVideoToGeneralVideo.js [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview changes without making updates
 *   --help       Show this help message
 */

const mongoose = require('mongoose');
const Code = require('../models/Code');

const dbURI = 'mongodb+srv://deif:1qaz2wsx@3devway.aa4i6ga.mongodb.net/biodiva2025?retryWrites=true&w=majority&appName=Cluster0';

function showHelp() {
    console.log(`
Convert Video Codes to GeneralVideo Script
==========================================

This script converts all codes with codeType 'Video' to 'GeneralVideo':
- Changes codeType from 'Video' to 'GeneralVideo'
- Sets isGeneralCode to true
- Removes chapterId, contentId, and contentName fields

Usage:
  node scripts/convertVideoToGeneralVideo.js [options]

Options:
  --dry-run    Preview changes without making updates
  --help       Show this help message

Examples:
  node scripts/convertVideoToGeneralVideo.js --dry-run
  node scripts/convertVideoToGeneralVideo.js
`);
}

async function convertVideoCodesToGeneralVideo(dryRun = false) {
    try {
        console.log('🔌 Connecting to database...');
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Database connected successfully!\n');

        if (dryRun) {
            console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
        }

        // Find all Video codes
        const videoCodes = await Code.find({ codeType: 'Video' });
        const totalCount = videoCodes.length;

        console.log(`📊 Found ${totalCount} codes with codeType 'Video'`);

        if (totalCount === 0) {
            console.log('✅ No Video codes found. Nothing to update.');
            await mongoose.disconnect();
            return;
        }

        // Show sample of codes that will be updated
        console.log('\n📋 Sample of codes to be updated:');
        videoCodes.slice(0, 5).forEach((code, index) => {
            console.log(`   ${index + 1}. Code: ${code.Code}`);
            console.log(`      - Current codeType: ${code.codeType}`);
            console.log(`      - chapterId: ${code.chapterId}`);
            console.log(`      - contentId: ${code.contentId}`);
            console.log(`      - contentName: ${code.contentName}`);
            console.log(`      - codeGrade: ${code.codeGrade}`);
            console.log(`      - isGeneralCode: ${code.isGeneralCode}`);
            console.log('');
        });

        if (totalCount > 5) {
            console.log(`   ... and ${totalCount - 5} more codes\n`);
        }

        if (dryRun) {
            console.log('🔍 DRY RUN: Would update the following:');
            console.log(`   - codeType: 'Video' → 'GeneralVideo'`);
            console.log(`   - isGeneralCode: false → true`);
            console.log(`   - chapterId: ${videoCodes[0].chapterId} → null`);
            console.log(`   - contentId: ${videoCodes[0].contentId} → null`);
            console.log(`   - contentName: ${videoCodes[0].contentName} → null`);
            console.log(`\n✅ DRY RUN completed. ${totalCount} codes would be updated.`);
            console.log('   Run without --dry-run to apply changes.');
        } else {
            console.log('🚀 Starting conversion...\n');

            let updatedCount = 0;
            let errorCount = 0;

            // Update each code
            for (const code of videoCodes) {
                try {
                    code.codeType = 'GeneralVideo';
                    code.isGeneralCode = true;
                    code.chapterId = null;
                    code.contentId = null;
                    code.contentName = null;
                    
                    await code.save();
                    updatedCount++;
                    
                    if (updatedCount % 10 === 0) {
                        console.log(`   ✓ Updated ${updatedCount}/${totalCount} codes...`);
                    }
                } catch (error) {
                    console.error(`   ❌ Error updating code ${code.Code}:`, error.message);
                    errorCount++;
                }
            }

            console.log('\n✅ Conversion completed!');
            console.log(`📊 Results:`);
            console.log(`   Total codes found: ${totalCount}`);
            console.log(`   Successfully updated: ${updatedCount}`);
            console.log(`   Errors: ${errorCount}`);

            // Verify the update
            const remainingVideoCodes = await Code.countDocuments({ codeType: 'Video' });
            const generalVideoCodes = await Code.countDocuments({ codeType: 'GeneralVideo' });
            
            console.log('\n📊 Verification:');
            console.log(`   Remaining 'Video' codes: ${remainingVideoCodes}`);
            console.log(`   Total 'GeneralVideo' codes: ${generalVideoCodes}`);
        }

    } catch (error) {
        console.error('❌ Script execution failed:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Database disconnected');
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    // Show help if requested
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    const dryRun = args.includes('--dry-run');
    
    console.log('🚀 Starting Video to GeneralVideo Conversion Script');
    console.log('Time:', new Date().toISOString());
    console.log('==================================================\n');
    
    try {
        await convertVideoCodesToGeneralVideo(dryRun);
        console.log('\n✅ Script completed successfully!');
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

module.exports = { convertVideoCodesToGeneralVideo };


