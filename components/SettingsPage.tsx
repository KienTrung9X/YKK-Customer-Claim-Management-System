import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { UserPlusIcon, EditIcon, XCircleIcon } from './Icons';
import { DEPARTMENTS } from '../constants';

interface UserModalProps {
  user?: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
  isCreating: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave, isCreating }) => {
  const [formData, setFormData] = useState<Omit<User, 'id' | 'avatarUrl'>>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || UserRole.QcStaff,
    department: user?.department || 'QC',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: User = isCreating
      ? {
        ...formData,
        id: `user-${Date.now()}`,
        avatarUrl: `https://api.dicebear.com/8.x/micah/svg?seed=${encodeURIComponent(formData.name)}`
      }
      : { ...user!, ...formData };
    
    onSave(userData);
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{isCreating ? 'Tạo người dùng mới' : 'Chỉnh sửa người dùng'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
            </div>
             <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vai trò</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phòng ban</label>
               <select id="department" name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end items-center p-4 border-t bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">Hủy</button>
            <button type="submit" className="ml-3 px-4 py-2 text-sm font-medium text-white bg-ykk-blue border border-transparent rounded-md shadow-sm hover:bg-ykk-blue/90 focus:outline-none">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC<{ users: User[], onAddUser: (user: User) => void, onUpdateUser: (user: User) => void }> = ({ users, onAddUser, onUpdateUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };
  
  const handleSaveUser = (user: User) => {
    if(editingUser) {
        onUpdateUser(user);
    } else {
        onAddUser(user);
    }
    handleCloseModal();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Quản lý người dùng</h2>
        <button onClick={handleOpenCreateModal} className="flex items-center px-4 py-2 bg-ykk-blue text-white rounded-lg shadow-sm hover:bg-ykk-blue/90 transition-colors">
          <UserPlusIcon className="w-5 h-5 mr-2" />
          Thêm người dùng
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">Tên</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Vai trò</th>
                <th scope="col" className="px-6 py-3">Phòng ban</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center">
                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full mr-3" />
                    {user.name}
                  </td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4">{user.department}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenEditModal(user)} className="font-medium text-ykk-blue hover:underline">
                      <EditIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && <UserModal user={editingUser} onClose={handleCloseModal} onSave={handleSaveUser} isCreating={!editingUser} />}
    </div>
  );
};