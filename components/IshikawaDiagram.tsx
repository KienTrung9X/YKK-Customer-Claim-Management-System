// FIX: Create the IshikawaDiagram component for root cause analysis visualization.
import React, { useState } from 'react';
import { FishboneAnalysisData, FishboneCategory } from '../types';
import { PlusCircleIcon, XCircleIcon } from './Icons';

interface CategoryBranchProps {
  category: FishboneCategory;
  onAddCause: (categoryId: string, cause: string) => void;
  onUpdateCategoryName: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  isEditable: boolean;
}

const CategoryBranch: React.FC<CategoryBranchProps> = ({ category, onAddCause, onUpdateCategoryName, onDeleteCategory, isEditable }) => {
  const [newCause, setNewCause] = useState('');
  const [isEditingName, setIsEditingName] = useState(category.name === 'Hạng mục mới');
  const [categoryName, setCategoryName] = useState(category.name);

  const handleAddCause = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCause.trim()) {
      onAddCause(category.id, newCause.trim());
      setNewCause('');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryName(e.target.value);
  };

  const handleNameBlur = () => {
    if (categoryName.trim() && categoryName !== category.name) {
      onUpdateCategoryName(category.id, categoryName.trim());
    } else {
      setCategoryName(category.name); // Revert if empty or unchanged
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setCategoryName(category.name);
      setIsEditingName(false);
    }
  };

  return (
    <div className="relative p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group transition-shadow duration-200 hover:shadow-md">
      {isEditable && (
        <button
          onClick={() => onDeleteCategory(category.id)}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Xóa hạng mục"
        >
          <XCircleIcon className="w-5 h-5" />
        </button>
      )}

      {isEditingName && isEditable ? (
        <input
          type="text"
          value={categoryName}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          autoFocus
          className="w-full px-2 py-1 mb-2 text-sm font-semibold border border-ykk-blue rounded-md bg-white dark:bg-gray-800"
        />
      ) : (
        <h4
          onDoubleClick={() => isEditable && setIsEditingName(true)}
          className="font-semibold text-ykk-blue mb-2 pr-6 cursor-pointer"
          title={isEditable ? "Nhấp đúp để sửa" : ""}
        >
          {category.name}
        </h4>
      )}

      <ul className="list-disc list-inside text-sm space-y-1 pl-2 min-h-[24px]">
        {category.causes.map((cause, index) => (
          <li key={index}>{cause}</li>
        ))}
        {category.causes.length === 0 && <li className="text-gray-400 italic">Chưa có nguyên nhân</li>}
      </ul>

      {isEditable && (
        <form onSubmit={handleAddCause} className="mt-2 flex items-center space-x-2">
          <input
            type="text"
            value={newCause}
            onChange={(e) => setNewCause(e.target.value)}
            placeholder="Thêm nguyên nhân..."
            className="flex-grow px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
          />
          <button type="submit" className="text-ykk-blue hover:text-ykk-blue/80 disabled:text-gray-400" disabled={!newCause.trim()}>
            <PlusCircleIcon className="w-5 h-5" />
          </button>
        </form>
      )}
    </div>
  );
};


export const IshikawaDiagram: React.FC<{ data: FishboneAnalysisData, onUpdate: (updatedData: FishboneAnalysisData) => void, isEditable: boolean }> = ({ data, onUpdate, isEditable }) => {
  
  const handleAddCause = (categoryId: string, cause: string) => {
    const updatedCategories = data.categories.map(cat => 
      cat.id === categoryId ? { ...cat, causes: [...cat.causes, cause] } : cat
    );
    onUpdate({ ...data, categories: updatedCategories });
  };
  
  const handleUpdateCategoryName = (categoryId: string, newName: string) => {
    const updatedCategories = data.categories.map(cat => 
      cat.id === categoryId ? { ...cat, name: newName } : cat
    );
    onUpdate({ ...data, categories: updatedCategories });
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    const updatedCategories = data.categories.filter(cat => cat.id !== categoryId);
    onUpdate({ ...data, categories: updatedCategories });
  };
  
  const handleAddCategory = () => {
    const newCategory: FishboneCategory = {
      id: `cat-${Date.now()}`,
      name: 'Hạng mục mới',
      causes: []
    };
    onUpdate({ ...data, categories: [...data.categories, newCategory] });
  };

  return (
    <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-100/50 dark:bg-gray-900/20">
        <div className="mb-4">
             <label htmlFor="problem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vấn đề (Problem)</label>
             <input
                type="text"
                id="problem"
                value={data.problem}
                readOnly={!isEditable}
                onChange={(e) => onUpdate({ ...data, problem: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                placeholder="Mô tả vấn đề chính..."
            />
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.categories.map((category) => (
          <CategoryBranch 
            key={category.id}
            category={category}
            onAddCause={handleAddCause}
            onUpdateCategoryName={handleUpdateCategoryName}
            onDeleteCategory={handleDeleteCategory}
            isEditable={isEditable}
          />
        ))}
        {isEditable && (
            <div className="flex items-center justify-center min-h-[150px] p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-ykk-blue hover:text-ykk-blue dark:hover:text-ykk-blue/90 transition-colors duration-200 cursor-pointer">
                <button onClick={handleAddCategory} className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 w-full h-full">
                    <PlusCircleIcon className="w-8 h-8"/>
                    <span className="mt-2 text-sm font-semibold">Thêm hạng mục</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};