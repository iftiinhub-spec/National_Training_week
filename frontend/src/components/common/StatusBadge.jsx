import React from 'react';
import { statusPresentation } from '../../utils/statusPresentation';

export const StatusBadge = ({ status }) => {
  if (!status) return null;
  const { badge: styleClass, label: labelText } = statusPresentation(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styleClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {labelText}
    </span>
  );
};

export default StatusBadge;
