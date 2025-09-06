import { Model, Optional } from 'sequelize';
interface TaskAttributes {
    id: number;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    projectId: number;
    assigneeId?: number;
    createdById: number;
    createdAt: Date;
    updatedAt: Date;
}
interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'dueDate' | 'assigneeId' | 'createdAt' | 'updatedAt'> {
}
declare class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
    id: number;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    projectId: number;
    assigneeId?: number;
    createdById: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { Task };
//# sourceMappingURL=Task.d.ts.map