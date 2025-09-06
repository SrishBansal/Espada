import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
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

  return (
    <Link
      to={`/projects/${project.id}`}
      className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {project.name}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {project.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {project.owner?.firstName?.charAt(0)}{project.owner?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {project.owner?.firstName} {project.owner?.lastName}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {project.tasks?.length || 0} tasks
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
