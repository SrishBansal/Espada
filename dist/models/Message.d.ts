import { Model, Optional } from 'sequelize';
interface MessageAttributes {
    id: number;
    content: string;
    messageType: 'text' | 'file' | 'image' | 'system';
    projectId: number;
    senderId: number;
    replyToId?: number;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'replyToId' | 'isEdited' | 'createdAt' | 'updatedAt'> {
}
declare class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    id: number;
    content: string;
    messageType: 'text' | 'file' | 'image' | 'system';
    projectId: number;
    senderId: number;
    replyToId?: number;
    isEdited: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { Message };
//# sourceMappingURL=Message.d.ts.map