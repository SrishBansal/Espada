import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Task } from '../types';
import { projectsAPI, tasksAPI } from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import ChatBox from '../components/ChatBox';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchTasks();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const data = await projectsAPI.getProject(parseInt(id!));
      setProject(data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch project');
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await tasksAPI.getProjectTasks(parseInt(id!));
      setTasks(data);
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = () => {
    fetchTasks(); // Refresh tasks when a task is created/updated
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  to="/"
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  ← Back to Dashboard
                </Link>
                <h1 className="mt-2 text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="mt-2 text-gray-600">{project.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Add Task
                </button>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Owner</h3>
                  <div className="mt-1 flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {project.owner?.firstName?.charAt(0)}{project.owner?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <span className="ml-3 text-sm text-gray-900">
                      {project.owner?.firstName} {project.owner?.lastName}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
                  <p className="mt-1 text-sm text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tasks'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'chat'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Chat
                </button>
              </nav>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex gap-6">
            {/* Tasks Section */}
            <div className="flex-1">
              <KanbanBoard
                tasks={tasks}
                projectId={parseInt(id!)}
                onTaskUpdate={handleTaskUpdate}
              />
            </div>

            {/* Chat Section */}
            <div className="w-96">
              <ChatBox projectId={parseInt(id!)} />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {activeTab === 'tasks' && (
              <KanbanBoard
                tasks={tasks}
                projectId={parseInt(id!)}
                onTaskUpdate={handleTaskUpdate}
              />
            )}
            {activeTab === 'chat' && (
              <ChatBox projectId={parseInt(id!)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
