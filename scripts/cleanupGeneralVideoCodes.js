#!/usr/bin/env node

/**
 * Script to cleanup GeneralVideo codes that still have contentName set
 * 
 * This script:
 * - Finds all GeneralVideo codes with contentName set (should be null)
 * - Removes contentName field (sets to null)
 * 
 * Usage:
 *   node scripts/cleanupGeneralVideoCodes.js [--dry-run]
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
Cleanup GeneralVideo Codes Script
==================================

This script cleans up GeneralVideo codes that still have contentName set:
- Removes contentName field (sets to null) for GeneralVideo codes

Usage:
  node scripts/cleanupGeneralVideoCodes.js [options]

Options:
  --dry-run    Preview changes without making updates
  --help       Show this help message

Examples:
  node scripts/cleanupGeneralVideoCodes.js --dry-run
  node scripts/cleanupGeneralVideoCodes.js
`);
}

async function cleanupGeneralVideoCodes(dryRun = false) {
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

        // Find all GeneralVideo codes with contentName set
        const codesToClean = await Code.find({ 
            codeType: 'GeneralVideo',
            contentName: { $ne: null, $exists: true }
        });
        const totalCount = codesToClean.length;

        console.log(`📊 Found ${totalCount} GeneralVideo codes with contentName set`);

        if (totalCount === 0) {
            console.log('✅ No codes need cleanup. All GeneralVideo codes are clean.');
            await mongoose.disconnect();
            return;
        }

        // Show sample of codes that will be updated
        console.log('\n📋 Sample of codes to be cleaned:');
        codesToClean.slice(0, 5).forEach((code, index) => {
            console.log(`   ${index + 1}. Code: ${code.Code}`);
            console.log(`      - Current contentName: ${code.contentName}`);
            console.log(`      - chapterId: ${code.chapterId}`);
            console.log(`      - contentId: ${code.contentId}`);
            console.log(`      - isGeneralCode: ${code.isGeneralCode}`);
            console.log('');
        });

        if (totalCount > 5) {
            console.log(`   ... and ${totalCount - 5} more codes\n`);
        }

        if (dryRun) {
            console.log('🔍 DRY RUN: Would update the following:');
            console.log(`   - contentName: '${codesToClean[0].contentName}' → null`);
            console.log(`\n✅ DRY RUN completed. ${totalCount} codes would be cleaned.`);
            console.log('   Run without --dry-run to apply changes.');
        } else {
            console.log('🚀 Starting cleanup...\n');

            let updatedCount = 0;
            let errorCount = 0;

            // Update each code using bulk update for better performance
            const batchSize = 100;
            for (let i = 0; i < codesToClean.length; i += batchSize) {
                const batch = codesToClean.slice(i, i + batchSize);
                
                try {
                    const ids = batch.map(code => code._id);
                    await Code.updateMany(
                        { _id: { $in: ids } },
                        { $set: { contentName: null } }
                    );
                    updatedCount += batch.length;
                    
                    if (updatedCount % 1000 === 0) {
                        console.log(`   ✓ Cleaned ${updatedCount}/${totalCount} codes...`);
                    }
                } catch (error) {
                    console.error(`   ❌ Error updating batch:`, error.message);
                    errorCount += batch.length;
                }
            }

            console.log('\n✅ Cleanup completed!');
            console.log(`📊 Results:`);
            console.log(`   Total codes found: ${totalCount}`);
            console.log(`   Successfully cleaned: ${updatedCount}`);
            console.log(`   Errors: ${errorCount}`);

            // Verify the update
            const remainingWithContentName = await Code.countDocuments({ 
                codeType: 'GeneralVideo',
                contentName: { $ne: null, $exists: true }
            });
            
            console.log('\n📊 Verification:');
            console.log(`   GeneralVideo codes with contentName: ${remainingWithContentName}`);
            console.log(`   (Should be 0)`);
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
    
    console.log('🚀 Starting GeneralVideo Cleanup Script');
    console.log('Time:', new Date().toISOString());
    console.log('==================================================\n');
    
    try {
        await cleanupGeneralVideoCodes(dryRun);
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

module.exports = { cleanupGeneralVideoCodes };




