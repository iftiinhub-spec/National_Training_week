import React from 'react';
import { InboxIcon } from '@icons';

export const EmptyState = ({ title = 'No records found', message = 'There are no items to display at this time.', action = null, icon: Icon = InboxIcon }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center my-6 max-w-lg mx-auto shadow-xs">
      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
