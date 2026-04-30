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
console.log("Diagnostic: MONGO_URI is present:", process.env.MONGO_URI.replace(/:([^@]+)@/, ":****@"));

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: ${origin} not allowed`));
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'Virtual Cosmos backend running 🚀' }));

// API Routes
app.use('/api', apiRoutes);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Socket.IO handles origin more flexibly
    methods: ['GET', 'POST'],
    credentials: false,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

setupSocketHandlers(io);

// Connect to MongoDB and then start server
connectDB().then(() => {
  console.log("DB connection established.");
}).catch(err => {
  console.error("Warning: Could not connect to database. Real-time features will work but persistence is disabled.", err.message);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
