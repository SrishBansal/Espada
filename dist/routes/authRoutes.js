"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// POST /auth/signup - Create new user
router.post('/signup', validation_1.validateSignup, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Check if user already exists
        const existingUser = await User_1.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Split name into first and last name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        // Create user
        const user = await User_1.User.create({
            username: email.split('@')[0], // Use email prefix as username
            email,
            password: hashedPassword,
            firstName,
            lastName,
        });
        // Generate JWT token
        const token = (0, auth_1.generateToken)(user.id);
        // Return user data without password
        const userResponse = user.toJSON();
        delete userResponse.password;
        res.status(201).json({
            message: 'User created successfully',
            user: userResponse,
            token
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
// POST /auth/login - Login user
router.post('/login', validation_1.validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const user = await User_1.User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Generate JWT token
        const token = (0, auth_1.generateToken)(user.id);
        // Return user data without password
        const userResponse = user.toJSON();
        delete userResponse.password;
        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map