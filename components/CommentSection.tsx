import React, { useState } from 'react';
import { Comment, User } from '../types';
import { SendIcon } from './Icons';

interface CommentSectionProps {
  comments: Comment[];
  currentUser: User;
  onAddComment: (text: string) => void;
}

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => (
  <div className="flex items-start space-x-3 py-3">
    <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-9 h-9 rounded-full" />
    <div className="flex-1">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
        <div className="flex justify-between items-baseline">
          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{comment.user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(comment.timestamp).toLocaleString()}</p>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.text}</p>
      </div>
    </div>
  </div>
);

export const CommentSection: React.FC<CommentSectionProps> = ({ comments, currentUser, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 p-4 border-b dark:border-gray-700">
        Bình luận & Thảo luận
      </h3>
      <div className="p-4 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">Chưa có bình luận nào.</p>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
          </div>
        )}
      </div>
      <div className="p-4 border-t dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-start space-x-3">
          <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-9 h-9 rounded-full" />
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              rows={2}
              className="w-full p-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-ykk-blue focus:border-ykk-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-none"
            />
            <button type="submit" className="absolute right-2 bottom-2 text-ykk-blue hover:text-ykk-blue/80 disabled:text-gray-400" disabled={!newComment.trim()}>
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
