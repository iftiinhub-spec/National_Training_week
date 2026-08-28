import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatTimeRange12 } from '../../utils/timeFormat';
import { trainingPath } from '../../utils/trainingLink';

export const TrainingCard = ({ training }) => {
  const {
    _id,
    title,
    coverImage,
    trainer,
    trainers,
    eventDay,
    category,
    date,
    startTime,
    endTime,
    level,
    status,
  } = training;
  const assignedTrainers = trainers?.length ? trainers : trainer ? [trainer] : [];

  // Fallback image graphic generator
  const imageUrl = coverImage
    ? `/${coverImage}`
    : null;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group">
      {/* Cover Image Container (16:9 ratio) */}
      <div className="relative aspect-video w-full bg-slate-800 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Branded Fallback Graphic if no image or image fails to load */}
        <div
          className={`w-full h-full flex flex-col items-center justify-center bg-slate-50 ${
            imageUrl ? 'hidden' : 'flex'
          }`}
        >
          <img src="/logo.jpg" alt="National Training Week" className="h-20 w-auto object-contain opacity-60" />
          <span className="text-xs font-semibold text-slate-400 mt-2">
            {category?.name || 'National Training Session'}
          </span>
        </div>

        {/* Status Overlay Badge */}
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge status={status} />
        </div>

        {/* Event Day Pill */}
        {eventDay && (
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-500/30">
            Day {eventDay.dayNumber}: {eventDay.theme}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-500">
            {category && (
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-sm border border-emerald-200">
                {category.name}
              </span>
            )}
            <span className="capitalize bg-slate-100 px-2 py-0.5 rounded-sm text-slate-600">
              {level} Level
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#1a6b3c] transition-colors line-clamp-2 mb-3">
            <Link to={trainingPath(training)}>{title}</Link>
          </h3>

          {/* Details list */}
          <div className="space-y-1.5 text-xs text-slate-600 mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formatTimeRange12(startTime, endTime)}</span>
            </div>
            {assignedTrainers.length > 0 && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                {assignedTrainers[0].photo ? (
                  <img src={`/${assignedTrainers[0].photo}`} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                ) : (
                  <UserIcon className="w-4 h-4 text-blue-600 shrink-0" />
                )}
                <span className="font-medium text-slate-700">
                  {assignedTrainers.map((item) => `${item.title || ''} ${item.name}`.trim()).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Link
            to={trainingPath(training)}
            className="w-full text-center bg-slate-900 hover:bg-[#1a6b3c] text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 group-hover:bg-[#1a6b3c]"
          >
            <span>View Session Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrainingCard;
