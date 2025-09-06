import { User } from './User';
import { Project } from './Project';
import { Task } from './Task';
import { Message } from './Message';

// Define associations
// User associations
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });

// Project associations
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Project.hasMany(Message, { foreignKey: 'projectId', as: 'messages' });

// Task associations
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

// Message associations
Message.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });
Message.hasMany(Message, { foreignKey: 'replyToId', as: 'replies' });

export { User, Project, Task, Message };
