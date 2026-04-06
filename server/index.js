require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const setupSocketHandlers = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Safety check for Environment Variables
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not defined in environment variables");
  process.exit(1);
}
console.log("Diagnostic: MONGO_URI is present:", process.env.MONGO_URI.replace(/:([^@]+)@/, ":****@")); // Mask password for safety even in diagnostic

// Middleware
app.use(cors({
  origin: '*', // Allow all for easier multi-device testing
  methods: ['GET', 'POST']
}));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all for easier multi-device testing
    methods: ['GET', 'POST']
  }
});

setupSocketHandlers(io);

// Connect to MongoDB and then start server
connectDB().then(() => {
  console.log("DB connection established.");
}).catch(err => {
  console.error("Warning: Could not connect to database. Real-time features will work but persistence is disabled.", err.message);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
