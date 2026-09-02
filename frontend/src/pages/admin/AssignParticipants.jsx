import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminProgramFilters from '../../components/admin/AdminProgramFilters';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, UserPlusIcon, XMarkIcon } from '@icons';
import ButtonSpinner from '../../components/common/ButtonSpinner';

export const AssignParticipants = () => {
  const [selection, setSelection] = useState({ event: '', eventDay: '', training: '' });
  const [training, setTraining] = useState(null);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const loadSession = useCallback(async (trainingId) => {
    if (!trainingId) {
      setTraining(null);
      setRegisteredIds(new Set());
      return;
    }
    try {
      const [trainingRes, registrationRes] = await Promise.all([
        api.get(`/admin/trainings/${trainingId}`),
        api.get(`/admin/registrations?training=${trainingId}&limit=100`),
      ]);
      setTraining(trainingRes.data?.training || null);
      setRegisteredIds(new Set((registrationRes.data || []).map((item) => String(item.participant?._id || item.participant))));
    } catch (err) {
      toast.error('Failed to load the selected session.');
    }
  }, []);

  useEffect(() => {
    setChosen([]);
    loadSession(selection.training);
  }, [selection.training, loadSession]);

  // The server does the searching, so any participant is reachable no matter how many exist —
  // rather than pulling a capped list into the browser and filtering it here.
  useEffect(() => {
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const query = new URLSearchParams({ limit: '50', isActive: 'true' });
        const term = search.trim();
        if (term) query.set('search', term);
        const res = await api.get(`/admin/participants?${query.toString()}`);
        setResults(res.data || []);
        setResultTotal(res.pagination?.total || 0);
      } catch (err) {
        toast.error('Participant search failed.');
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const isChosen = (id) => chosen.some((item) => item._id === id);
  const toggleChosen = (participant) => setChosen((current) => (
    current.some((item) => item._id === participant._id)
      ? current.filter((item) => item._id !== participant._id)
      : [...current, participant]
  ));

  const handleAssign = async () => {
    if (!selection.training || !chosen.length) return;
    setAssigning(true);
    try {
      const res = await api.post('/admin/registrations', {
        trainingId: selection.training,
        participantIds: chosen.map((item) => item._id),
      });
      toast.success(res.message || 'Participants assigned.');
      setChosen([]);
      await loadSession(selection.training);
    } catch (err) {
      toast.error(err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const seatsLabel = training?.capacity
    ? `${training.filledSeats || 0} of ${training.capacity} seats filled`
    : 'No capacity limit set';
  const assignable = chosen.filter((item) => !registeredIds.has(String(item._id)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Assign Participants</h1>
        <p className="mt-1 text-xs text-slate-500">
          Place participants into a session directly. Assignments are approved immediately, so a seat is reserved,
          an attendance row is opened, and the participant is emailed.
        </p>
      </div>

      <AdminProgramFilters value={selection} onChange={setSelection} includeSession />

      {!selection.training ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          Choose an event, day and training session above to begin assigning participants.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a6b3c]">Selected session</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{training?.title || 'Loading...'}</h2>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
              <span>{training?.date ? new Date(training.date).toLocaleDateString() : '—'}</span>
              <span className="font-bold">{seatsLabel}</span>
              <span>{registeredIds.size} participant{registeredIds.size === 1 ? '' : 's'} already registered</span>
            </div>
          </div>

          {chosen.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase text-slate-600">Selected ({chosen.length})</p>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={assigning || !assignable.length}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1a6b3c] px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  {assigning ? <><ButtonSpinner /> Assigning...</> : `Assign ${assignable.length} participant${assignable.length === 1 ? '' : 's'}`}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {chosen.map((item) => (
                  <span key={item._id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-bold text-slate-700">
                    {item.fullName}
                    <button type="button" onClick={() => toggleChosen(item)} aria-label={`Remove ${item.fullName}`} className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              {chosen.length !== assignable.length && (
                <p className="mt-3 text-[11px] font-medium text-amber-700">
                  {chosen.length - assignable.length} of these are already registered for this session and will be skipped.
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search all participants by name or email..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-medium"
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {searching ? 'Searching...' : `Showing ${results.length} of ${resultTotal} participant${resultTotal === 1 ? '' : 's'}. Refine your search to narrow the list.`}
              </p>
            </div>

            <div className="max-h-[28rem] overflow-y-auto divide-y divide-slate-100">
              {results.map((participant) => {
                const already = registeredIds.has(String(participant._id));
                return (
                  <label key={participant._id} className={`flex cursor-pointer items-center gap-3 p-4 text-xs hover:bg-slate-50 ${already ? 'opacity-60' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChosen(participant._id)}
                      onChange={() => toggleChosen(participant)}
                      disabled={already}
                      className="h-4 w-4 accent-[#1a6b3c]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-slate-900">{participant.fullName}</span>
                      <span className="block truncate text-slate-500">{participant.email}</span>
                    </span>
                    {already && <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">Registered</span>}
                  </label>
                );
              })}
              {!searching && !results.length && (
                <p className="p-12 text-center text-sm text-slate-500">
                  {search ? `No participant matches "${search}".` : 'No participants found.'}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssignParticipants;
