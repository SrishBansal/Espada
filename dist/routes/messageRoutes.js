"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
// GET /api/messages/project/:projectId - Get messages by project
router.get('/project/:projectId', async (req, res) => {
    try {
        const messages = await models_1.Message.findAll({
            where: { projectId: req.params.projectId },
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
                {
                    model: models_1.Message,
                    as: 'replyTo',
                    include: [
                        { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }
                    ]
                }
            ],
            order: [['createdAt', 'ASC']]
        });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// GET /api/messages/:id - Get message by ID
router.get('/:id', async (req, res) => {
    try {
        const message = await models_1.Message.findByPk(req.params.id, {
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
                {
                    model: models_1.Message,
                    as: 'replyTo',
                    include: [
                        { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }
                    ]
                },
                {
                    model: models_1.Message,
                    as: 'replies',
                    include: [
                        { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] }
                    ]
                }
            ]
        });
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json(message);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});
// POST /api/messages - Create new message
router.post('/', async (req, res) => {
    try {
        const { content, messageType, projectId, senderId, replyToId } = req.body;
        const message = await models_1.Message.create({
            content,
            messageType: messageType || 'text',
            projectId,
            senderId,
            replyToId,
        });
        // Fetch the created message with associations
        const createdMessage = await models_1.Message.findByPk(message.id, {
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
                {
                    model: models_1.Message,
                    as: 'replyTo',
                    include: [
                        { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }
                    ]
                }
            ]
        });
        res.status(201).json(createdMessage);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to create message' });
    }
});
// PUT /api/messages/:id - Update message (edit)
router.put('/:id', async (req, res) => {
    try {
        const { content } = req.body;
        const message = await models_1.Message.findByPk(req.params.id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        await message.update({
            content,
            isEdited: true,
        });
        // Fetch the updated message with associations
        const updatedMessage = await models_1.Message.findByPk(message.id, {
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'] },
                {
                    model: models_1.Message,
                    as: 'replyTo',
                    include: [
                        { model: models_1.User, as: 'sender', attributes: ['id', 'username', 'firstName', 'lastName'] }
                    ]
                }
            ]
        });
        res.json(updatedMessage);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to update message' });
    }
});
// DELETE /api/messages/:id - Delete message
router.delete('/:id', async (req, res) => {
    try {
        const message = await models_1.Message.findByPk(req.params.id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        await message.destroy();
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map