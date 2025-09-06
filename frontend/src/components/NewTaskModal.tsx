import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';

// Email validation function
const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Format date to YYYY-MM-DD for date input
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onTaskCreated: () => void;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, projectId, onTaskCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    status: 'todo' as 'todo' | 'in-progress' | 'completed' | 'blocked',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Commented out unused users state since it's not currently used
  // const [users, setUsers] = useState<User[]>([]);
  
  // Track touched fields for validation
  const [touched, setTouched] = useState({
    title: false,
    assignee: false,
    dueDate: false
  });
  
  // Track validation errors
  const [errors, setErrors] = useState({
    title: '',
    assignee: '',
    dueDate: ''
  });

  // Commented out unused effect since users state is not used
  // useEffect(() => {
  //   if (isOpen) {
  //     // In a real app, you'd fetch users from an API
  //     // For now, we'll use a mock list or get from context
  //     setUsers([]);
  //   }
  // }, [isOpen]);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {
      title: !formData.title.trim() ? 'Task title is required' : '',
      assignee: formData.assignee && !validateEmail(formData.assignee) ? 'Please enter a valid email address' : '',
      dueDate: formData.dueDate && new Date(formData.dueDate) < new Date() ? 'Due date cannot be in the past' : ''
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Validate on form data change
  useEffect(() => {
    if (Object.values(touched).some(field => field)) {
      validateForm();
    }
  }, [formData, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      title: true,
      assignee: true,
      dueDate: true
    });
    
    // Validate form
    if (!validateForm() || !formData.title.trim()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await tasksAPI.createTask(projectId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignee: formData.assignee || undefined,
        dueDate: formData.dueDate || undefined,
        status: formData.status,
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        assignee: '',
        dueDate: '',
        status: 'todo',
      });
      onTaskCreated();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    if (error) setError('');
  };
  
  const handleBlur = (field: 'title' | 'assignee' | 'dueDate') => {
    setTouched({ ...touched, [field]: true });
  };
  
  // Get minimum date (today) for due date input
  const today = formatDate(new Date());

  if (!isOpen) return null;
  
  // Check if fields are valid
  const isTitleValid = formData.title.trim() !== '' || !touched.title;
  const isAssigneeValid = !errors.assignee || !touched.assignee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {(error || !isTitleValid) && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error || 'Please fix the errors in the form before submitting.'}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  !isTitleValid ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="Enter task title"
                onBlur={() => handleBlur('title')}
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                Assignee Email
              </label>
              <div>
                <input
                  type="email"
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  onBlur={() => handleBlur('assignee')}
                  className={`w-full px-3 py-2 border ${
                    !isAssigneeValid ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                  placeholder="Enter assignee's email (optional)"
                />
                {!isAssigneeValid && (
                  <p className="mt-1 text-sm text-red-600">{errors.assignee}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  onBlur={() => handleBlur('dueDate')}
                  min={today}
                  className={`w-full px-3 py-2 border ${
                    errors.dueDate ? 'border-red-500' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className={`px-4 py-2 ${
                !formData.title.trim() ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'
              } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;
