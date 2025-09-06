"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.generateToken = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const prisma = new client_1.PrismaClient();
/**
 * Middleware to authenticate JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1]; // Bearer <token>
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Add user to request object
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expired' });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        console.error('Authentication error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};
exports.authenticate = authenticate;
/**
 * Generate JWT token for a user
 */
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, env_1.env.JWT_SECRET, {
        expiresIn: '24h'
    });
};
exports.generateToken = generateToken;
/**
 * Middleware to check if user has required roles
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // In a real app, you would check the user's roles here
        // For this example, we'll just check if the user is the owner of the resource
        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        // This is a simplified example - in a real app, you would check the user's roles
        // from the database or token claims
        const hasRole = requiredRoles.some(role => {
            // Example: Check if user is the owner of the resource
            if (role === 'owner' && req.params.userId === req.user?.id) {
                return true;
            }
            return false;
        });
        if (!hasRole) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map