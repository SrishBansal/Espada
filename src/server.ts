import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes';
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
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
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
  socket.on('joinProject', (data: { projectId: string, userId: string }) => {
    const { projectId, userId } = data;
    socket.join(`project-${projectId}`);
    socket.data.userId = userId;
    socket.data.projectId = projectId;
    console.log(`User ${userId} joined project ${projectId}`);
    
    // Notify others in the room
    socket.to(`project-${projectId}`).emit('userJoined', { userId, projectId });
  });

  // Leave project room
  socket.on('leaveProject', (data: { projectId: string, userId: string }) => {
    const { projectId, userId } = data;
    socket.leave(`project-${projectId}`);
    console.log(`User ${userId} left project ${projectId}`);
    
    // Notify others in the room
    socket.to(`project-${projectId}`).emit('userLeft', { userId, projectId });
  });

  // Handle new message
  socket.on('sendMessage', async (data: { projectId: string, senderId: string, text: string }) => {
    try {
      const { projectId, senderId, text } = data;
      
      // Save message to database
      const { Message, User } = await import('./models');
      const message = await Message.create({
        content: text,
        messageType: 'text',
        projectId: parseInt(projectId),
        senderId: parseInt(senderId),
      });
      
      // Fetch message with sender details
      const messageWithSender = await Message.findByPk(message.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] }
        ]
      });
      
      // Broadcast message to all users in the project room (including sender)
      messagesNamespace.to(`project-${projectId}`).emit('newMessage', {
        id: messageWithSender?.id,
        content: messageWithSender?.content,
        sender: (messageWithSender as any)?.sender,
        projectId: parseInt(projectId),
        timestamp: messageWithSender?.createdAt
      });
      
      console.log(`Message sent in project ${projectId} by user ${senderId}`);
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    const projectId = socket.data.projectId;
    
    if (userId && projectId) {
      console.log(`User ${userId} disconnected from project ${projectId}`);
      // Notify others in the room
      socket.to(`project-${projectId}`).emit('userLeft', { userId, projectId });
    }
    
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
