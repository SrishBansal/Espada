"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
// Import database
const database_1 = require("./config/database");
require("./models"); // Import models to establish associations
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/auth', authRoutes_1.default);
app.use('/projects', projectRoutes_1.default);
app.use('/tasks', taskRoutes_1.default);
app.use('/api/messages', messageRoutes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'SynergySphere Backend is running!' });
});
// Socket.IO setup for real-time messaging
const messagesNamespace = io.of('/messages');
messagesNamespace.on('connection', (socket) => {
    console.log('User connected to messages namespace:', socket.id);
    // Join project room
    socket.on('joinProject', (data) => {
        const { projectId, userId } = data;
        socket.join(`project-${projectId}`);
        socket.data.userId = userId;
        socket.data.projectId = projectId;
        console.log(`User ${userId} joined project ${projectId}`);
        // Notify others in the room
        socket.to(`project-${projectId}`).emit('userJoined', { userId, projectId });
    });
    // Leave project room
    socket.on('leaveProject', (data) => {
        const { projectId, userId } = data;
        socket.leave(`project-${projectId}`);
        console.log(`User ${userId} left project ${projectId}`);
        // Notify others in the room
        socket.to(`project-${projectId}`).emit('userLeft', { userId, projectId });
    });
    // Handle new message
    socket.on('sendMessage', async (data) => {
        try {
            const { projectId, senderId, text } = data;
            // Save message to database
            const { Message, User } = await Promise.resolve().then(() => __importStar(require('./models')));
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
                sender: messageWithSender?.sender,
                projectId: parseInt(projectId),
                timestamp: messageWithSender?.createdAt
            });
            console.log(`Message sent in project ${projectId} by user ${senderId}`);
        }
        catch (error) {
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
        await database_1.sequelize.authenticate();
        console.log('Database connection established successfully.');
        // Sync database models
        await database_1.sequelize.sync({ force: false }); // Set to true to recreate tables
        console.log('Database models synchronized.');
        // Start server
        server.listen(PORT, () => {
            console.log(`🚀 SynergySphere Backend running on port ${PORT}`);
            console.log(`📡 Socket.IO server ready for real-time messaging`);
        });
    }
    catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map