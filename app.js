require('dotenv').config()
const express = require('express');
const morgan = require('morgan')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongo')
const session = require('express-session')
const fileUpload = require('express-fileupload');
const cors = require('cors')
const cron = require('node-cron');



const fs = require('fs')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')
// const { authenticateUser } = require('./middleware/authMiddleware')




const homeRoutes = require('./routes/homeRoutes')
const teacherRoutes = require('./routes/teacherRoutes')
const studentRoutes = require('./routes/studentRoutes');

// Import notification service (per-student individual notifications)
const { 
  processDueNotifications, 
  scheduleExistingVideoNotifications,
  getNotificationStats 
} = require('./utils/notificationService');

// express app
const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure file upload middleware
app.use(fileUpload({
  useTempFiles: false,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  debug: false
}));

const socketio = require('socket.io');
const path = require('path');


// CONECT to mongodb
let io
const dbURI = 'mongodb+srv://deif:1qaz2wsx@3devway.aa4i6ga.mongodb.net/biodiva2025?retryWrites=true&w=majority&appName=Cluster0';
// const dbURI = 'mongodb://localhost:27017/biodiva2025';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async (result) => {
        let server = app.listen(8000);

        io = socketio(server)
        io.on('connection', (socket) => {
            console.log(`New connection: ${socket.id}`);
        })

        console.log("Server is running on port http://localhost:8000");
        
        // ==================  WhatsApp Notification System (Per-Student)  ==================
        console.log('🔔 Starting WhatsApp Notification System...');
        
        // Schedule notifications for any existing videos about to expire
        await scheduleExistingVideoNotifications();
        
        // Process notification queue every minute
        // Each student gets their notification exactly when their video is 24h from expiry
        cron.schedule('* * * * *', async () => {
            try {
                await processDueNotifications();
            } catch (error) {
                console.error('❌ Notification processing error:', error.message);
            }
        }, {
            scheduled: true,
            timezone: 'Africa/Cairo'
        });
        
        // Show daily stats at 8 AM Cairo time
        cron.schedule('0 8 * * *', async () => {
            try {
                const stats = await getNotificationStats();
                console.log(`\n📊 [${new Date().toLocaleString('ar-EG')}] Daily Notification Stats:`);
                console.log(`   📬 Pending: ${stats.pending}`);
                console.log(`   ✅ Sent today: ${stats.sentToday}`);
                console.log(`   ❌ Failed today: ${stats.failedToday}`);
            } catch (error) {
                console.error('❌ Stats error:', error.message);
            }
        }, {
            scheduled: true,
            timezone: 'Africa/Cairo'
        });
        
        console.log('✅ Notification system active:');
        console.log('   📬 Queue check: Every minute (per-student)');
        console.log('   ⏰ Each student notified 24h before THEIR video expires');
        console.log('   📊 Daily stats: 8:00 AM (Cairo)');
        // ==================  End Notification System  ==================
        
    }).catch((err) => {
        console.log(err)
    })

// register view engine
app.set('view engine', 'ejs');
// listen for requests


app.use(cors())
app.use((req, res, next) => {
    req.io = io; // Attach io to the request object
    next(); // Move to the next middleware or route handler
});

app.use(morgan('dev'));
app.use(express.static('public'))
app.use(cookieParser())
// let uri = ""; // Declare the 'uri' variable

app.use(session({
    secret: "Keybord",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: dbURI
    }),

}))


// Custom middlfsdfeware to make io accessible in all routes


app.use('/', homeRoutes)
app.use('/teacher', teacherRoutes)
app.use('/student', studentRoutes)








app.use((req, res) => {
    res.status(404).render('404', { title: '404' });
});
