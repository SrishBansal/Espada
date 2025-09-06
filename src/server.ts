import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import messageRoutes from './routes/messageRoutes';

// Import database
import { sequelize } from './config/database';
import './models'; // Import models to establish associations

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SynergySphere Backend is running!' });
});

// Socket.IO setup for real-time messaging
const messagesNamespace = io.of('/messages');

messagesNamespace.on('connection', (socket) => {
  console.log('User connected to messages namespace:', socket.id);

  // Join project room
  socket.on('join-project', (projectId: string) => {
    socket.join(`project-${projectId}`);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  // Leave project room
  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project-${projectId}`);
    console.log(`User ${socket.id} left project ${projectId}`);
  });

  // Handle new message
  socket.on('send-message', (data) => {
    // Broadcast message to all users in the project room
    socket.to(`project-${data.projectId}`).emit('new-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from messages namespace:', socket.id);
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync database models
    await sequelize.sync({ force: false }); // Set to true to recreate tables
    console.log('Database models synchronized.');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 SynergySphere Backend running on port ${PORT}`);
      console.log(`📡 Socket.IO server ready for real-time messaging`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
