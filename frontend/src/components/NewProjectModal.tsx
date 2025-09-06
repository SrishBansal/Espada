import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';

// Email validation function
const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: [] as string[],
  });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({
    name: false,
    members: false
  });
  const [emailError, setEmailError] = useState('');

  // Validate form
  const validateForm = () => {
    const errors = {
      name: !formData.name.trim() ? 'Project name is required' : '',
      email: newMemberEmail && !validateEmail(newMemberEmail) ? 'Please enter a valid email address' : ''
    };
    setEmailError(errors.email);
    return !errors.name && !errors.email;
  };

  // Validate on form data change
  useEffect(() => {
    if (touched.name) {
      validateForm();
    }
  }, [formData.name, newMemberEmail, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ name: true, members: true });
    
    // Validate form
    if (!validateForm() || !formData.name.trim()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await projectsAPI.createProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
        members: formData.members,
      });
      
      // Reset form
      setFormData({ name: '', description: '', members: [] });
      setNewMemberEmail('');
      onProjectCreated();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = () => {
    const email = newMemberEmail.trim();
    
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (formData.members.includes(email)) {
      setEmailError('This email has already been added');
      return;
    }
    
    setFormData({
      ...formData,
      members: [...formData.members, email],
    });
    setNewMemberEmail('');
    setEmailError('');
  };

  const removeMember = (email: string) => {
    setFormData({
      ...formData,
      members: formData.members.filter(member => member !== email),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
  };

  const handleBlur = (field: 'name' | 'members') => {
    setTouched({ ...touched, [field]: true });
  };

  if (!isOpen) return null;
  
  // Check if name is valid
  const isNameValid = formData.name.trim() !== '' || !touched.name;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (error) setError('');
                }}
                onBlur={() => handleBlur('name')}
                className={`w-full px-3 py-2 border ${
                  !isNameValid ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                placeholder="Enter project name"
                required
              />
              {!isNameValid && (
                <p className="mt-1 text-sm text-red-600">Project name is required</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter project description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Team Members
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => {
                      setNewMemberEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    onKeyPress={handleKeyPress}
                    onBlur={() => handleBlur('members')}
                    className={`w-full px-3 py-2 border ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    placeholder="Enter email address"
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addMember}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Add
                </button>
              </div>
              
              {formData.members.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.members.map((email, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(email)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              disabled={isLoading || !formData.name.trim()}
              className={`px-4 py-2 ${
                !formData.name.trim() ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'
              } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
