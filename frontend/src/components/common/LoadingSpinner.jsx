import React from 'react';

export const LoadingSpinner = ({ label = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-slate-200 border-t-[#1a6b3c] rounded-full animate-spin mb-3`}
      ></div>
      {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
