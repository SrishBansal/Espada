"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
// GET /api/tasks - Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await models_1.Task.findAll({
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
                { model: models_1.User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ]
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
// GET /api/tasks/project/:projectId - Get tasks by project
router.get('/project/:projectId', async (req, res) => {
    try {
        const tasks = await models_1.Task.findAll({
            where: { projectId: req.params.projectId },
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
                { model: models_1.User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ]
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
// GET /api/tasks/:id - Get task by ID
router.get('/:id', async (req, res) => {
    try {
        const task = await models_1.Task.findByPk(req.params.id, {
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
                { model: models_1.User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ]
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});
// POST /api/tasks - Create new task
router.post('/', async (req, res) => {
    try {
        const { title, description, status, priority, dueDate, projectId, assigneeId, createdById } = req.body;
        const task = await models_1.Task.create({
            title,
            description,
            status: status || 'todo',
            priority: priority || 'medium',
            dueDate,
            projectId,
            assigneeId,
            createdById,
        });
        // Fetch the created task with associations
        const createdTask = await models_1.Task.findByPk(task.id, {
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'name'] },
                { model: models_1.User, as: 'assignee', attributes: ['id', 'username', 'firstName', 'lastName'] },
                { model: models_1.User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ]
        });
        res.status(201).json(createdTask);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to create task' });
    }
});
// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
    try {
        const { title, description, status, priority, dueDate, assigneeId } = req.body;
        const task = await models_1.Task.findByPk(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await task.update({
            title,
            description,
            status,
            priority,
            dueDate,
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
        res.json(updatedTask);
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to update task' });
    }
});
// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
    try {
        const task = await models_1.Task.findByPk(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await task.destroy();
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map