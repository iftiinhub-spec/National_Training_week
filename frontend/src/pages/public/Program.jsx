import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { CalendarDaysIcon, ClockIcon, UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export const Program = () => {
  const [eventData, setEventData] = useState(null);
  const [programDays, setProgramDays] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await api.get('/public/program');
        if (res.success && res.data) {
          setEventData(res.data.event);
          setProgramDays(res.data.program || []);
          if (res.data.program?.length > 0) {
            setActiveDay(res.data.program[0].day._id);
          }
        }
      } catch (err) {
        console.error('Error fetching program:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, []);

  if (loading) return <LoadingSpinner label="Loading 6-day program schedule..." />;

  const currentProgramDay = programDays.find((p) => p.day._id === activeDay) || programDays[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Title Header */}
      <div className="bg-gradient-to-r from-[#1a6b3c] to-[#155289] text-white rounded-2xl p-8 md:p-10 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
          Official Event Schedule
        </span>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">
          National Training Week 2026 Program
        </h1>
        <p className="text-emerald-100 text-sm md:text-base mt-2 max-w-2xl">
          Theme: <span className="font-semibold text-white">{eventData?.theme || 'Artificial Intelligence for National Transformation'}</span>
        </p>
        <p className="text-xs text-slate-200 mt-1">
          {eventData?.startDate ? new Date(eventData.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Sept 14'} – {eventData?.endDate ? new Date(eventData.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Sept 19, 2026'} | 6 Days • 18 Total Training Sessions
        </p>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-slate-200">
        {programDays.map((p) => {
          const isActive = p.day._id === activeDay;
          return (
            <button
              key={p.day._id}
              onClick={() => setActiveDay(p.day._id)}
              className={`px-5 py-3 rounded-xl font-bold text-sm shrink-0 transition-all text-left border ${
                isActive
                  ? 'bg-[#1a6b3c] text-white border-[#1a6b3c] shadow-md'
                  : 'bg-white text-slate-700 hover:bg-emerald-50 border-slate-200'
              }`}
            >
              <span className="block text-xs uppercase tracking-wider opacity-80">
                Day {p.day.dayNumber}
              </span>
              <span className="block font-extrabold text-sm truncate max-w-[160px]">
                {p.day.theme}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Day Detail Header */}
      {currentProgramDay && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#1a6b3c] uppercase tracking-wider">
                Selected Event Day
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                Day {currentProgramDay.day.dayNumber}: {currentProgramDay.day.theme}
              </h2>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4 text-[#1a6b3c]" />
                <span>{new Date(currentProgramDay.day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>

            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 font-semibold shadow-xs">
              {currentProgramDay.sessions?.length || 0} Sessions Scheduled
            </div>
          </div>

          {/* Sessions List */}
          {currentProgramDay.sessions && currentProgramDay.sessions.length > 0 ? (
            <div className="space-y-4">
              {currentProgramDay.sessions.map((session) => (
                <div
                  key={session._id}
                  className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-emerald-100 text-[#1a6b3c] text-xs font-bold px-2.5 py-0.5 rounded">
                        {session.category?.name || 'Session'}
                      </span>
                      <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded capitalize">
                        {session.level} Level
                      </span>
                      <StatusBadge status={session.status} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 hover:text-[#1a6b3c] transition-colors">
                      <Link to={`/trainings/${session._id}`}>{session.title}</Link>
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <ClockIcon className="w-4 h-4 text-[#1a6b3c]" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                      {session.trainer && (
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-slate-800">
                            Trainer: {session.trainer.title ? `${session.trainer.title} ` : ''}{session.trainer.name}
                          </span>
                        </div>
                      )}
                      {session.audience && (
                        <span className="text-slate-500">
                          Audience: {session.audience}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <Link
                      to={`/trainings/${session._id}`}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#1a6b3c] hover:bg-[#124d2a] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <span>View & Register</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
              No sessions scheduled for this day yet.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Program;
