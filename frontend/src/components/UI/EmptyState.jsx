import React from 'react';
import { Search, FileText, Inbox, FolderOpen } from 'lucide-react';

const icons = {
  search: Search,
  document: FileText,
  inbox: Inbox,
  folder: FolderOpen,
};

const EmptyState = ({
  title = 'No items found',
  description = 'There are no items to display at the moment.',
  icon = 'inbox',
  action = null,
}) => {
  const Icon = icons[icon] || Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
};

export default EmptyState;

