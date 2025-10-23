#!/usr/bin/env node

/**
 * Test script for student status functionality
 * This script tests the student status logic without making database changes
 */

const mongoose = require('mongoose');
const { StudentStatusManager } = require('../utils/studentStatusScript');

// Mock data for testing
const mockStudents = [
    {
        _id: 'student1',
        Username: 'Student with Card, No Videos',
        place: 'online',
        videosInfo: [
            { _id: 'video1', hasWatched10Percent: false },
            { _id: 'video2', hasWatched10Percent: false }
        ]
    },
    {
        _id: 'student2', 
        Username: 'Student with Card, Watched Videos',
        place: 'center',
        videosInfo: [
            { _id: 'video1', hasWatched10Percent: true },
            { _id: 'video2', hasWatched10Percent: false }
        ]
    },
    {
        _id: 'student3',
        Username: 'Student without Card, No Videos', 
        place: 'online',
        videosInfo: [
            { _id: 'video1', hasWatched10Percent: false }
        ]
    },
    {
        _id: 'student4',
        Username: 'Student without Card, Watched Videos',
        place: 'center', 
        videosInfo: [
            { _id: 'video1', hasWatched10Percent: true }
        ]
    }
];

// Mock Card model
const mockCards = [
    { userId: 'student1', isActive: true },
    { userId: 'student2', isActive: true }
];

async function testStudentStatusLogic() {
    console.log('🧪 Testing Student Status Logic');
    console.log('================================\n');

    const manager = new StudentStatusManager();

    // Override the hasAssignedCard method for testing
    manager.hasAssignedCard = async function(user) {
        return mockCards.some(card => card.userId === user._id && card.isActive);
    };

    for (const student of mockStudents) {
        console.log(`Testing: ${student.Username}`);
        console.log(`Current status: ${student.place}`);
        
        const hasCard = await manager.hasAssignedCard(student);
        const hasWatchedVideos = manager.hasWatchedVideos(student);
        const newStatus = await manager.determineStudentStatus(student);
        
        console.log(`Has card: ${hasCard}`);
        console.log(`Has watched videos: ${hasWatchedVideos}`);
        console.log(`Determined status: ${newStatus}`);
        console.log(`Status change needed: ${student.place !== newStatus ? 'YES' : 'NO'}`);
        console.log('---\n');
    }

    console.log('✅ Test completed successfully!');
}

// Run the test
if (require.main === module) {
    testStudentStatusLogic().catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testStudentStatusLogic };
