const dotenv = require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/dbConnect.js');
const bodyParser = require('body-parser');
const authRoute = require('./routes/auth.route.js');
const chatRoute = require('./routes/chat.route.js');
const statusRoute = require('./routes/status.route.js');
const initializeSocket = require('./services/socketService');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;

const corsOption = {
    origin: process.env.FRONTEND_URL,
    credentials: true
}

// middleware
app.use(cors(corsOption));
app.use(express.json()); // parse json
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); // parse urlencoded
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// db connection
connectDB();

// create server
const server = http.createServer(app);
const io = initializeSocket(server);

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


server.listen(port,()=>{
    console.log(`server: listening on port ${port}`)
})