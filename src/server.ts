import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { env, corsConfig, serverConfig } from './config/env';
import prisma from './config/db';

// Import routes
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import messageRoutes from './routes/messageRoutes';

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: corsConfig.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  path: '/socket.io',
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  // In a real app, verify the JWT token here
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'ok', 
      db: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      db: 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Middleware
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// API Routes
app.use('/auth', authRoutes);
app.use('/projects', authenticate, projectRoutes);
app.use('/tasks', authenticate, taskRoutes);
app.use('/api/messages', authenticate, messageRoutes);

// 404 handler
app.use((req, res, next) => {
  next(createError(404, 'Not Found'));
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO setup for real-time messaging
const messagesNamespace = io.of('/realtime');

// Track connected users
const connectedUsers = new Map<string, string>();

messagesNamespace.on('connection', (socket: Socket) => {
  const userId = socket.handshake.auth.userId;
  
  if (!userId) {
    console.warn('Connection attempt without userId');
    return socket.disconnect(true);
  }

  // Store user's socket ID
  connectedUsers.set(userId, socket.id);
  console.log(`User ${userId} connected to realtime namespace`);

  // Join project room
  socket.on('joinProject', async ({ projectId }: { projectId: string }) => {
    try {
      // Verify user has access to the project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            { members: { some: { id: userId } } },
          ],
        },
      });

      if (!project) {
        return socket.emit('error', { message: 'Access denied' });
      }

      socket.join(`project-${projectId}`);
      console.log(`User ${userId} joined project ${projectId}`);
      
      // Notify others in the room
      socket.to(`project-${projectId}`).emit('userJoined', { 
        userId, 
        projectId,
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error('Error joining project room:', error);
      socket.emit('error', { message: 'Failed to join project' });
    }
  });

  // Leave project room
  socket.on('leaveProject', ({ projectId }: { projectId: string }) => {
    socket.leave(`project-${projectId}`);
    console.log(`User ${userId} left project ${projectId}`);
    
    // Notify others in the room
    socket.to(`project-${projectId}`).emit('userLeft', { 
      userId, 
      projectId,
      timestamp: new Date().toISOString() 
    });
  });

  // Handle new message
  socket.on('sendMessage', async (
    { projectId, content }: { projectId: string; content: string },
    callback: (response: { success: boolean; error?: string }) => void
  ) => {
    try {
      // Validate input
      if (!content?.trim()) {
        return callback({ success: false, error: 'Message content is required' });
      }

      // Save message to database
      const message = await prisma.$transaction(async (tx: any) => {
        // Verify user has access to the project
        const project = await tx.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { ownerId: userId },
              { members: { some: { id: userId } } },
            ],
          },
        });

        if (!project) {
          throw new Error('Access denied');
        }

        // Create message
        return tx.message.create({
          data: {
            content: content.trim(),
            projectId,
            senderId: userId,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      });

      // Acknowledge to sender
      callback({ success: true });
      
      // Broadcast message to all users in the project room (including sender)
      messagesNamespace.to(`project-${projectId}`).emit('newMessage', {
        id: message.id,
        content: message.content,
        sender: message.sender,
        projectId: message.projectId,
        createdAt: message.createdAt.toISOString(),
      });
      
      console.log(`Message sent in project ${projectId} by user ${userId}`);
    } catch (error) {
      console.error('Error handling message:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      });
    }
  });

  // Handle task status update
  socket.on('updateTaskStatus', async (
    { taskId, status }: { taskId: string; status: string },
    callback: (response: { success: boolean; error?: string }) => void
  ) => {
    try {
      // Validate status
      if (!['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].includes(status)) {
        return callback({ success: false, error: 'Invalid status' });
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: { status },
        include: {
          project: {
            select: { id: true },
          },
        },
      });

      // Acknowledge to sender
      callback({ success: true });
      
      // Broadcast update to all users in the project room
      messagesNamespace.to(`project-${task.projectId}`).emit('taskUpdated', {
        taskId: task.id,
        status: task.status,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      });
      
      console.log(`Task ${taskId} status updated to ${status} by user ${userId}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      callback({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update task status' 
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    connectedUsers.delete(userId);
    console.log(`User ${userId} disconnected from realtime namespace`);
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to database with retry logic
    await prisma.$connectWithRetry();
    
    // Apply database migrations
    console.log('🔍 Checking for database migrations...');
    await prisma.$executeRaw`PRAGMA journal_mode = WAL;`; // Enable WAL mode for better concurrency
    
    // Start server
    server.listen(serverConfig.port, () => {
      console.log(`🚀 Server running in ${serverConfig.isProduction ? 'production' : 'development'} mode`);
      console.log(`🌐 API available at http://localhost:${serverConfig.port}`);
      console.log(`📡 Socket.IO server ready at /realtime namespace`);
      console.log(`💾 Database: ${env.DATABASE_URL}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Consider whether to exit the process in production
  if (serverConfig.isProduction) {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Consider whether to exit the process in production
  if (serverConfig.isProduction) {
    process.exit(1);
  }
});

// Handle graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down server...');
  
  try {
    // Close HTTP server
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          console.error('Error closing server:', err);
          reject(err);
        } else {
          console.log('✅ HTTP server closed');
          resolve();
        }
      });
    });
    
    // Close WebSocket connections
    io.close(() => {
      console.log('✅ WebSocket server closed');
    });
    
    // Disconnect from database
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();
