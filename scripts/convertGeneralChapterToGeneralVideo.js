#!/usr/bin/env node

/**
 * Script to convert all GeneralChapter codes to GeneralVideo codes
 * 
 * This script:
 * - Finds all codes with codeType === 'GeneralChapter'
 * - Converts them to codeType === 'GeneralVideo'
 * - Keeps isGeneralCode as true
 * - Ensures chapterId, contentId, and contentName are null
 * 
 * Usage:
 *   node scripts/convertGeneralChapterToGeneralVideo.js [--dry-run]
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
Convert GeneralChapter Codes to GeneralVideo Script
===================================================

This script converts all codes with codeType 'GeneralChapter' to 'GeneralVideo':
- Changes codeType from 'GeneralChapter' to 'GeneralVideo'
- Keeps isGeneralCode as true
- Ensures chapterId, contentId, and contentName are null

Usage:
  node scripts/convertGeneralChapterToGeneralVideo.js [options]

Options:
  --dry-run    Preview changes without making updates
  --help       Show this help message

Examples:
  node scripts/convertGeneralChapterToGeneralVideo.js --dry-run
  node scripts/convertGeneralChapterToGeneralVideo.js
`);
}

async function convertGeneralChapterToGeneralVideo(dryRun = false) {
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

        // Find all GeneralChapter codes
        const generalChapterCodes = await Code.find({ codeType: 'GeneralChapter' });
        const totalCount = generalChapterCodes.length;

        console.log(`📊 Found ${totalCount} codes with codeType 'GeneralChapter'`);

        if (totalCount === 0) {
            console.log('✅ No GeneralChapter codes found. Nothing to update.');
            await mongoose.disconnect();
            return;
        }

        // Show sample of codes that will be updated
        console.log('\n📋 Sample of codes to be updated:');
        generalChapterCodes.slice(0, 5).forEach((code, index) => {
            console.log(`   ${index + 1}. Code: ${code.Code}`);
            console.log(`      - Current codeType: ${code.codeType}`);
            console.log(`      - chapterId: ${code.chapterId}`);
            console.log(`      - contentId: ${code.contentId}`);
            console.log(`      - contentName: ${code.contentName}`);
            console.log(`      - chapterName: ${code.chapterName}`);
            console.log(`      - codeGrade: ${code.codeGrade}`);
            console.log(`      - isGeneralCode: ${code.isGeneralCode}`);
            console.log('');
        });

        if (totalCount > 5) {
            console.log(`   ... and ${totalCount - 5} more codes\n`);
        }

        if (dryRun) {
            console.log('🔍 DRY RUN: Would update the following:');
            console.log(`   - codeType: 'GeneralChapter' → 'GeneralVideo'`);
            console.log(`   - isGeneralCode: ${generalChapterCodes[0].isGeneralCode} → true`);
            console.log(`   - chapterId: ${generalChapterCodes[0].chapterId} → null`);
            console.log(`   - contentId: ${generalChapterCodes[0].contentId} → null`);
            console.log(`   - contentName: ${generalChapterCodes[0].contentName || 'null'} → null`);
            console.log(`   - chapterName: ${generalChapterCodes[0].chapterName || 'null'} → null`);
            console.log(`\n✅ DRY RUN completed. ${totalCount} codes would be updated.`);
            console.log('   Run without --dry-run to apply changes.');
        } else {
            console.log('🚀 Starting conversion...\n');

            let updatedCount = 0;
            let errorCount = 0;

            // Update each code using bulk update for better performance
            const batchSize = 100;
            for (let i = 0; i < generalChapterCodes.length; i += batchSize) {
                const batch = generalChapterCodes.slice(i, i + batchSize);
                
                try {
                    const ids = batch.map(code => code._id);
                    await Code.updateMany(
                        { _id: { $in: ids } },
                        { 
                            $set: { 
                                codeType: 'GeneralVideo',
                                isGeneralCode: true,
                                chapterId: null,
                                contentId: null,
                                contentName: null,
                                chapterName: null
                            } 
                        }
                    );
                    updatedCount += batch.length;
                    
                    if (updatedCount % 50 === 0) {
                        console.log(`   ✓ Updated ${updatedCount}/${totalCount} codes...`);
                    }
                } catch (error) {
                    console.error(`   ❌ Error updating batch:`, error.message);
                    errorCount += batch.length;
                }
            }

            console.log('\n✅ Conversion completed!');
            console.log(`📊 Results:`);
            console.log(`   Total codes found: ${totalCount}`);
            console.log(`   Successfully updated: ${updatedCount}`);
            console.log(`   Errors: ${errorCount}`);

            // Verify the update
            const remainingGeneralChapterCodes = await Code.countDocuments({ codeType: 'GeneralChapter' });
            const generalVideoCodes = await Code.countDocuments({ codeType: 'GeneralVideo' });
            
            console.log('\n📊 Verification:');
            console.log(`   Remaining 'GeneralChapter' codes: ${remainingGeneralChapterCodes}`);
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
    
    console.log('🚀 Starting GeneralChapter to GeneralVideo Conversion Script');
    console.log('Time:', new Date().toISOString());
    console.log('==================================================\n');
    
    try {
        await convertGeneralChapterToGeneralVideo(dryRun);
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

module.exports = { convertGeneralChapterToGeneralVideo };




