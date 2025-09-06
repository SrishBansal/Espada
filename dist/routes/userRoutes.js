"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// GET /api/users - Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User_1.User.findAll({
            attributes: { exclude: ['password'] },
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User_1.User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// POST /api/users - Create new user
router.post('/', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, avatar } = req.body;
        const user = await User_1.User.create({
            username,
            email,
            password, // In production, hash this password
            firstName,
            lastName,
            avatar,
        });
        // Return user without password
        const userResponse = user.toJSON();
        delete userResponse.password;
        res.status(201).json(userResponse);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to create user' });
    }
});
// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    try {
        const { username, email, firstName, lastName, avatar } = req.body;
        const user = await User_1.User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await user.update({
            username,
            email,
            firstName,
            lastName,
            avatar,
        });
        // Return user without password
        const userResponse = user.toJSON();
        delete userResponse.password;
        res.json(userResponse);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to update user' });
    }
});
// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User_1.User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await user.destroy();
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map