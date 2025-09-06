"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const http_errors_1 = __importDefault(require("http-errors"));
const logger_1 = require("./middleware/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const env_1 = require("./config/env");
const db_1 = __importDefault(require("./config/db"));
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
// Initialize Express app
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Initialize Socket.IO with CORS configuration
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.corsConfig.origin,
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
        await db_1.default.$queryRaw `SELECT 1`;
        res.json({
            status: 'ok',
            db: 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    }
    catch (error) {
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
app.use((0, cors_1.default)(env_1.corsConfig));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(logger_1.logger);
// API Routes
app.use('/auth', authRoutes_1.default);
app.use('/projects', auth_1.authenticate, projectRoutes_1.default);
app.use('/tasks', auth_1.authenticate, taskRoutes_1.default);
app.use('/api/messages', auth_1.authenticate, messageRoutes_1.default);
// 404 handler
app.use((req, res, next) => {
    next((0, http_errors_1.default)(404, 'Not Found'));
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Socket.IO setup for real-time messaging
const messagesNamespace = io.of('/realtime');
// Track connected users
const connectedUsers = new Map();
messagesNamespace.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
        console.warn('Connection attempt without userId');
        return socket.disconnect(true);
    }
    // Store user's socket ID
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} connected to realtime namespace`);
    // Join project room
    socket.on('joinProject', async ({ projectId }) => {
        try {
            // Verify user has access to the project
            const project = await db_1.default.project.findFirst({
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
        }
        catch (error) {
            console.error('Error joining project room:', error);
            socket.emit('error', { message: 'Failed to join project' });
        }
    });
    // Leave project room
    socket.on('leaveProject', ({ projectId }) => {
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
    socket.on('sendMessage', async ({ projectId, content }, callback) => {
        try {
            // Validate input
            if (!content?.trim()) {
                return callback({ success: false, error: 'Message content is required' });
            }
            // Save message to database
            const message = await db_1.default.$transaction(async (tx) => {
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
        }
        catch (error) {
            console.error('Error handling message:', error);
            callback({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send message'
            });
        }
    });
    // Handle task status update
    socket.on('updateTaskStatus', async ({ taskId, status }, callback) => {
        try {
            // Validate status
            if (!['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].includes(status)) {
                return callback({ success: false, error: 'Invalid status' });
            }
            const task = await db_1.default.task.update({
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
        }
        catch (error) {
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
        await db_1.default.$connectWithRetry();
        // Apply database migrations
        console.log('🔍 Checking for database migrations...');
        await db_1.default.$executeRaw `PRAGMA journal_mode = WAL;`; // Enable WAL mode for better concurrency
        // Start server
        server.listen(env_1.serverConfig.port, () => {
            console.log(`🚀 Server running in ${env_1.serverConfig.isProduction ? 'production' : 'development'} mode`);
            console.log(`🌐 API available at http://localhost:${env_1.serverConfig.port}`);
            console.log(`📡 Socket.IO server ready at /realtime namespace`);
            console.log(`💾 Database: ${env_1.env.DATABASE_URL}`);
        });
    }
    catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Consider whether to exit the process in production
    if (env_1.serverConfig.isProduction) {
        process.exit(1);
    }
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Consider whether to exit the process in production
    if (env_1.serverConfig.isProduction) {
        process.exit(1);
    }
});
// Handle graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down server...');
    try {
        // Close HTTP server
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    console.error('Error closing server:', err);
                    reject(err);
                }
                else {
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
        await db_1.default.$disconnect();
        console.log('✅ Database connection closed');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};
// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start the server
startServer();
//# sourceMappingURL=server.js.map