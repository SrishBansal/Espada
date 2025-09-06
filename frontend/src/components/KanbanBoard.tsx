import React, { useState } from 'react';
import { Task } from '../types';
import TaskCard from './TaskCard';
import NewTaskModal from './NewTaskModal';

interface KanbanBoardProps {
  tasks: Task[];
  projectId: number;
  onTaskUpdate: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, projectId, onTaskUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' as const },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress' as const },
    { id: 'completed', title: 'Done', status: 'completed' as const },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getColumnColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'border-gray-200 bg-gray-50';
      case 'in-progress':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          + New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className={`rounded-lg border-2 ${getColumnColor(column.status)}`}>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">{column.title}</h3>
              <span className="text-sm text-gray-500">
                {getTasksByStatus(column.status).length} tasks
              </span>
            </div>
            <div className="p-4 space-y-3 min-h-[400px]">
              {getTasksByStatus(column.status).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {getTasksByStatus(column.status).length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onTaskCreated={onTaskUpdate}
      />
    </div>
  );
};

export default KanbanBoard;
