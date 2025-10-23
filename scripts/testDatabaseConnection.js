#!/usr/bin/env node

/**
 * Test database connection script
 */

const mongoose = require('mongoose');

const dbURI = 'mongodb+srv://deif:1qaz2wsx@3devway.aa4i6ga.mongodb.net/biodiva2025?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
    console.log('🔌 Testing database connection...');
    
    try {
        await mongoose.connect(dbURI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Database connected successfully!');
        
        // Test a simple query
        const User = require('../models/User');
        const userCount = await User.countDocuments({ isTeacher: false });
        console.log(`📊 Found ${userCount} students in database`);
        
        // Test Card model
        const Card = require('../models/Card');
        const cardCount = await Card.countDocuments();
        console.log(`🎫 Found ${cardCount} cards in database`);
        
        console.log('✅ Database test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Database disconnected');
    }
}

if (require.main === module) {
    testConnection().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testConnection };
