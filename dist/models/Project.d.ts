import { Model, Optional } from 'sequelize';
interface ProjectAttributes {
    id: number;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    startDate?: Date;
    endDate?: Date;
    ownerId: number;
    createdAt: Date;
    updatedAt: Date;
}
interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> {
}
declare class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
    id: number;
    name: string;
    description: string;
    status: 'planning' | 'active' | 'completed' | 'on-hold';
    startDate?: Date;
    endDate?: Date;
    ownerId: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { Project };
//# sourceMappingURL=Project.d.ts.map