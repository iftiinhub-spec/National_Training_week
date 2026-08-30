import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import {
  VideoCameraIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { formatTimeRange12 } from '../../utils/timeFormat';

const getSessionStart = (meeting) => {
  if (!meeting?.sessionDate || !meeting?.sessionStartTime) return null;
  const value = new Date(`${String(meeting.sessionDate).slice(0, 10)}T${meeting.sessionStartTime}:00+03:00`);
  return Number.isFinite(value.getTime()) ? value : null;
};

const formatCountdown = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

const PAGE_SIZE = 100;

export const MyRegistrations = () => {
  const confirmAction = useConfirmDialog();
  const [registrations, setRegistrations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [filterOptions, setFilterOptions] = useState({ events: [], days: [] });
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!modalOpen) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [modalOpen]);

  // The endpoint is paginated, so an explicit page size plus a Load more control is what keeps a
  // participant with many registrations from silently seeing only the first page.
  const fetchRegistrations = useCallback(async (nextPage = 1) => {
    if (nextPage > 1) setLoadingMore(true);
    try {
      // The filters are applied by the server, not to the rows already on screen. With a paginated
      // list those are two different answers: filtering here would only ever search the pages that
      // happen to be loaded, and the "Showing x of y" count would be wrong.
      const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) });
      if (selectedEvent) params.append('event', selectedEvent);
      if (selectedDay) params.append('eventDay', selectedDay);
      const res = await api.get(`/participant/registrations?${params}`);
      if (res.success) {
        const batch = res.data || [];
        setRegistrations((current) => (nextPage === 1 ? batch : [...current, ...batch]));
        setTotal(res.pagination?.total ?? batch.length);
        setPage(nextPage);
      }
    } catch (err) {
      toast.error('Failed to load registrations.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedEvent, selectedDay]);

  // Changing a filter re-runs this from page 1, which replaces the rows instead of appending them.
  // Appending would leave the previous filter's results sitting above the new ones.
  useEffect(() => {
    fetchRegistrations(1);
  }, [fetchRegistrations]);

  // The options come from the participant's own registrations, so every edition and day offered
  // here is one that actually has results.
  useEffect(() => {
    api.get('/participant/registrations/filters')
      .then((res) => { if (res.success) setFilterOptions({ events: res.data?.events || [], days: res.data?.days || [] }); })
      .catch(() => {});
  }, []);

  // A day belongs to one edition, so offering days from other editions would only produce empty
  // results. Once an edition is chosen the day list narrows to it.
  const dayOptions = useMemo(() => (
    selectedEvent
      ? filterOptions.days.filter((day) => String(day.event) === selectedEvent)
      : filterOptions.days
  ), [filterOptions.days, selectedEvent]);

  const handleEventChange = (value) => {
    setSelectedEvent(value);
    // A day held over from the previous edition would contradict the new edition and return nothing.
    if (value && !filterOptions.days.some((day) => String(day._id) === selectedDay && String(day.event) === value)) {
      setSelectedDay('');
    }
  };

  const filtersActive = Boolean(selectedEvent || selectedDay);

  const handleViewMeeting = async (regId) => {
    try {
      const res = await api.get(`/participant/registrations/${regId}`);
      if (res.success && res.data) {
        if (res.data.meeting) {
          setSelectedMeeting({
            ...res.data.meeting,
            sessionDate: res.data.registration?.training?.date,
            sessionStartTime: res.data.registration?.training?.startTime,
          });
          setModalOpen(true);
        } else {
          toast.error('Meeting details have not been released by the Moderator yet.');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch meeting info.');
    }
  };

  const handleCancel = async (regId) => {
    if (!await confirmAction({ title: 'Cancel registration?', message: 'You will lose your place in this session. You may only register again if registration is still open and capacity remains.', confirmLabel: 'Cancel registration' })) return;
    try {
      const res = await api.patch(`/participant/registrations/${regId}/cancel`);
      if (res.success) {
        toast.success('Registration cancelled.');
        fetchRegistrations();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel registration.');
    }
  };

  if (loading) return <LoadingSpinner label="Loading your registered trainings..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Trainings</h1>
        <p className="text-xs text-slate-500 mt-1">
          View your training enrollment statuses, access released meeting links, or manage registrations.
        </p>
      </div>

      {(filterOptions.events.length > 1 || filterOptions.days.length > 1) && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <FunnelIcon className="h-4 w-4 text-[#1a6b3c]" />
            Filter
          </span>

          <select
            value={selectedEvent}
            onChange={(e) => handleEventChange(e.target.value)}
            aria-label="Filter by event"
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/40"
          >
            <option value="">All events</option>
            {filterOptions.events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.name}{event.year ? ` (${event.year})` : ''}
              </option>
            ))}
          </select>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            aria-label="Filter by day"
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/40"
          >
            <option value="">All days</option>
            {dayOptions.map((day) => (
              <option key={day._id} value={day._id}>
                Day {day.dayNumber}{day.theme ? ` — ${day.theme}` : ''}
              </option>
            ))}
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={() => { setSelectedEvent(''); setSelectedDay(''); }}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs font-medium text-slate-500">
            {total} {total === 1 ? 'registration' : 'registrations'}{filtersActive ? ' matched' : ''}
          </span>
        </div>
      )}

      {registrations.length > 0 ? (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const tr = reg.training || {};
            return (
              <div
                key={reg._id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={reg.status} type="registration" />
                    <span className="text-xs text-slate-400">
                      Enrolled: {new Date(reg.registeredAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{tr.title}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1 font-medium">
                      <CalendarIcon className="w-4 h-4 text-[#1a6b3c]" />
                      <span>{tr.date ? new Date(tr.date).toLocaleDateString() : 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <ClockIcon className="w-4 h-4 text-[#1a6b3c]" />
                      <span>{formatTimeRange12(tr.startTime, tr.endTime)}</span>
                    </div>
                    {tr.trainer && (
                      <span className="text-slate-700 font-semibold">
                        Trainers: {(tr.trainers?.length ? tr.trainers : [tr.trainer]).filter(Boolean).map((trainer) => trainer.name).join(', ')}
                      </span>
                    )}
                  </div>

                  {reg.status === 'approved' && tr.materials?.length > 0 && (
                    <Link
                      to={`/portal/materials?session=${tr._id}`}
                      aria-label={`Open learning materials for ${tr.title}`}
                      className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-[#1a6b3c] transition hover:border-[#1a6b3c]/50 hover:bg-emerald-100"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      {tr.materials.length} learning material{tr.materials.length === 1 ? '' : 's'}
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {reg.status === 'approved' && (
                    <button
                      onClick={() => handleViewMeeting(reg._id)}
                      className="px-4 py-2.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <VideoCameraIcon className="w-4 h-4" />
                      <span>View Online Meeting</span>
                    </button>
                  )}

                  {['pending', 'approved'].includes(reg.status) && !reg.attended && (
                    <button
                      onClick={() => handleCancel(reg._id)}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {registrations.length < total && (
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500">Showing {registrations.length} of {total} registrations.</p>
              <button
                type="button"
                onClick={() => fetchRegistrations(page + 1)}
                disabled={loadingMore}
                className="mt-2 rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={AcademicCapIcon}
          title={filtersActive ? 'No trainings match these filters' : 'No registered training sessions'}
          message={filtersActive
            ? 'No registration of yours falls in the selected event or day. Clear the filters to see them all.'
            : 'Browse the published trainings and click register to participate.'}
        />
      )}

      {/* Meeting Details Modal */}
      {modalOpen && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <VideoCameraIcon className="w-5 h-5 text-[#1a6b3c]" />
                Online Meeting Access Details
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs uppercase font-bold text-[#1a6b3c] block">Platform</span>
                <span className="font-bold text-slate-900 capitalize">{selectedMeeting.platform}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Meeting Joining Link</span>
                <a
                  href={selectedMeeting.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-blue-50 text-blue-700 font-mono text-xs break-all hover:underline"
                >
                  {selectedMeeting.meetingUrl}
                </a>
              </div>

              {selectedMeeting.meetingId && (
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl text-xs">
                  <span className="font-bold text-slate-500">Meeting ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedMeeting.meetingId}</span>
                </div>
              )}

              {selectedMeeting.passcode && (
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl text-xs">
                  <span className="font-bold text-slate-500">Passcode:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedMeeting.passcode}</span>
                </div>
              )}

              {selectedMeeting.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <strong>Notes:</strong> {selectedMeeting.notes}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              {(() => {
                const sessionStart = getSessionStart(selectedMeeting);
                const waiting = sessionStart && now < sessionStart.getTime();
                return waiting ? (
                  <button type="button" disabled className="w-full cursor-not-allowed rounded-xl bg-slate-200 py-3 text-center text-sm font-bold text-slate-500">
                    Join available in {formatCountdown(sessionStart.getTime() - now)}
                  </button>
                ) : (
                  <a href={selectedMeeting.meetingUrl} target="_blank" rel="noopener noreferrer" className="block w-full rounded-xl bg-[#1a6b3c] py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#124d2a]">
                    Launch & Join Meeting Now
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyRegistrations;
