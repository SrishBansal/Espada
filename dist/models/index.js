"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.Task = exports.Project = exports.User = void 0;
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const Project_1 = require("./Project");
Object.defineProperty(exports, "Project", { enumerable: true, get: function () { return Project_1.Project; } });
const Task_1 = require("./Task");
Object.defineProperty(exports, "Task", { enumerable: true, get: function () { return Task_1.Task; } });
const Message_1 = require("./Message");
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return Message_1.Message; } });
// Define associations
// User associations
User_1.User.hasMany(Project_1.Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
User_1.User.hasMany(Task_1.Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
User_1.User.hasMany(Task_1.Task, { foreignKey: 'createdById', as: 'createdTasks' });
User_1.User.hasMany(Message_1.Message, { foreignKey: 'senderId', as: 'sentMessages' });
// Project associations
Project_1.Project.belongsTo(User_1.User, { foreignKey: 'ownerId', as: 'owner' });
Project_1.Project.hasMany(Task_1.Task, { foreignKey: 'projectId', as: 'tasks' });
Project_1.Project.hasMany(Message_1.Message, { foreignKey: 'projectId', as: 'messages' });
// Task associations
Task_1.Task.belongsTo(Project_1.Project, { foreignKey: 'projectId', as: 'project' });
Task_1.Task.belongsTo(User_1.User, { foreignKey: 'assigneeId', as: 'assignee' });
Task_1.Task.belongsTo(User_1.User, { foreignKey: 'createdById', as: 'creator' });
// Message associations
Message_1.Message.belongsTo(Project_1.Project, { foreignKey: 'projectId', as: 'project' });
Message_1.Message.belongsTo(User_1.User, { foreignKey: 'senderId', as: 'sender' });
Message_1.Message.belongsTo(Message_1.Message, { foreignKey: 'replyToId', as: 'replyTo' });
Message_1.Message.hasMany(Message_1.Message, { foreignKey: 'replyToId', as: 'replies' });
//# sourceMappingURL=index.js.map