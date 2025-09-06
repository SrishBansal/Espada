"use strict";
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
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
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
app.use('/api/users', userRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/tasks', taskRoutes_1.default);
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
    socket.on('join-project', (projectId) => {
        socket.join(`project-${projectId}`);
        console.log(`User ${socket.id} joined project ${projectId}`);
    });
    // Leave project room
    socket.on('leave-project', (projectId) => {
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