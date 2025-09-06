"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// GET /projects/:id/tasks - List tasks in that project
router.get('/projects/:projectId/tasks', auth_1.authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = req.user.id;
        // First check if user has access to this project
        const project = await models_1.Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.ownerId !== userId) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        const tasks = await models_1.Task.findAll({
            where: { projectId },
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
                { model: models_1.User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(tasks);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
// POST /projects/:id/tasks - Add new task
router.post('/projects/:projectId/tasks', auth_1.authenticateToken, validation_1.validateTask, async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = req.user.id;
        const { title, description, assignee, dueDate, status } = req.body;
        // First check if user has access to this project
        const project = await models_1.Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.ownerId !== userId) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        // Find assignee user if provided
        let assigneeId = null;
        if (assignee) {
            const assigneeUser = await models_1.User.findOne({ where: { username: assignee } });
            if (assigneeUser) {
                assigneeId = assigneeUser.id;
            }
        }
        const task = await models_1.Task.create({
            title,
            description: description || '',
            status: status || 'todo',
            priority: 'medium',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            projectId: parseInt(projectId),
            assigneeId: assigneeId || undefined,
            createdById: userId,
        });
        // Fetch the created task with associations
        const createdTask = await models_1.Task.findByPk(task.id, {
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
                { model: models_1.User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ]
        });
        res.status(201).json({
            message: 'Task created successfully',
            task: createdTask
        });
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
// PATCH /tasks/:id - Update task
router.patch('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;
        const { title, description, status, priority, dueDate, assignee } = req.body;
        const task = await models_1.Task.findByPk(taskId, {
            include: [{ model: models_1.Project, as: 'project' }]
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Check if user has access to the project this task belongs to
        if (task.project && task.project.ownerId !== userId) {
            return res.status(403).json({ error: 'Access denied to this task' });
        }
        // Find assignee user if provided
        let assigneeId = task.assigneeId;
        if (assignee !== undefined) {
            if (assignee) {
                const assigneeUser = await models_1.User.findOne({ where: { username: assignee } });
                assigneeId = assigneeUser ? assigneeUser.id : undefined;
            }
            else {
                assigneeId = undefined;
            }
        }
        await task.update({
            title: title || task.title,
            description: description !== undefined ? description : task.description,
            status: status || task.status,
            priority: priority || task.priority,
            dueDate: dueDate ? new Date(dueDate) : task.dueDate,
            assigneeId,
        });
        // Fetch the updated task with associations
        const updatedTask = await models_1.Task.findByPk(task.id, {
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
                { model: models_1.User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ]
        });
        res.json({
            message: 'Task updated successfully',
            task: updatedTask
        });
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
// GET /tasks/:id - Get single task
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;
        const task = await models_1.Task.findByPk(taskId, {
            include: [
                { model: models_1.Project, as: 'project' },
                { model: models_1.User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
                { model: models_1.User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ]
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Check if user has access to the project this task belongs to
        if (task.project && task.project.ownerId !== userId) {
            return res.status(403).json({ error: 'Access denied to this task' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});
// DELETE /tasks/:id - Delete task
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;
        const task = await models_1.Task.findByPk(taskId, {
            include: [{ model: models_1.Project, as: 'project' }]
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Check if user has access to the project this task belongs to
        if (task.project && task.project.ownerId !== userId) {
            return res.status(403).json({ error: 'Access denied to this task' });
        }
        await task.destroy();
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map