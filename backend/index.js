const dotenv = require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/dbConnect.js');
const bodyParser = require('body-parser');
const authRoute = require('./routes/auth.route.js');
const chatRoute = require('./routes/chat.route.js');
const statusRoute = require('./routes/status.route.js');
const scheduledMessageRoute = require('./routes/scheduledMessage.route.js');
const adminRoute = require('./routes/admin.route.js');
const reportRoute = require('./routes/report.route.js');
const initializeSocket = require('./services/socketService');
const { initializeCleanupService } = require('./services/messageCleanupService');
const { initializeScheduledMessageService } = require('./services/scheduledMessageService');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;

const corsOption = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://whatapp-clone-frontend-p4ji.onrender.com'
    ],
    credentials: true
}

// middleware
app.use(cors(corsOption));
app.use(express.json()); // parse json
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); // parse urlencoded

// db connection
connectDB();

// create server
const server = http.createServer(app);
const io = initializeSocket(server);

// Initialize message cleanup service
initializeCleanupService(io, io.socketUserMap);

// Initialize scheduled message service
initializeScheduledMessageService(io, io.socketUserMap);

// socket middleware
app.use((req,res,next)=>{
    req.io = io;
    req.socketUserMap = io.socketUserMap
    next();
})

// routes
app.use('/api/auth',authRoute);
app.use("/api/chats",chatRoute)
app.use("/api/status",statusRoute)
app.use("/api/scheduled-messages",scheduledMessageRoute)
app.use("/api/admin",adminRoute)
app.use("/api/reports",reportRoute)


server.listen(port,()=>{
    console.log(`server: listening on port ${port}`)
})