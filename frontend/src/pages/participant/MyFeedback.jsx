import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import { ChatBubbleLeftEllipsisIcon } from '@icons';

export const MyFeedback = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState(null);

  const [form, setForm] = useState({
    contentRating: 5,
    trainerRating: 5,
    organizationRating: 5,
    comments: '',
    suggestions: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [attRes, fbRes] = await Promise.all([
        api.get('/participant/attendance'),
        api.get('/participant/feedback'),
      ]);

      if (attRes.success) {
        // Filter only PRESENT sessions
        const presentAtt = (attRes.data.attendance || []).filter((a) => a.status === 'present');
        setAttendanceRecords(presentAtt);
      }
      if (fbRes.success) {
        setMyFeedback(fbRes.data.feedback || []);
      }
    } catch (err) {
      console.error('Error fetching feedback data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTraining) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/participant/trainings/${selectedTraining}/feedback`, form);
      if (res.success) {
        toast.success('Thank you! Evaluation submitted successfully.');
        setSelectedTraining(null);
        setForm({ contentRating: 5, trainerRating: 5, organizationRating: 5, comments: '', suggestions: '' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading training feedback..." />;

  // Filter sessions that have NOT been evaluated yet
  const evaluatedIds = myFeedback.map((f) => f.training?._id || f.training);
  const eligibleToSubmit = attendanceRecords.filter((a) => a.training && !evaluatedIds.includes(a.training._id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Training Evaluations & Feedback</h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit session ratings and comments for trainings you attended (status: Present).
        </p>
      </div>

      {/* Eligible Sessions to Submit Feedback */}
      {eligibleToSubmit.length > 0 && (
        <div className="bg-[#f0f9f4] rounded-2xl p-6 border border-emerald-200 space-y-4">
          <h3 className="text-sm font-bold text-[#1a6b3c] uppercase tracking-wider">
            Pending Session Evaluation
          </h3>

          <div className="space-y-3">
            {eligibleToSubmit.map((att) => (
              <div
                key={att._id}
                className="bg-white p-4 rounded-xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{att.training?.title}</h4>
                  <p className="text-xs text-slate-500">Attended on: {new Date(att.checkinTime || att.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => setSelectedTraining(att.training._id)}
                  className="px-4 py-2 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-lg text-xs transition-colors shrink-0"
                >
                  Evaluate Session Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission Form Modal / Box */}
      {selectedTraining && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">Submit Session Evaluation</h3>
            <button onClick={() => setSelectedTraining(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Content Rating (1-5)</label>
                <select
                  value={form.contentRating}
                  onChange={(e) => setForm({ ...form, contentRating: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold bg-white"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{r} Stars - {r === 5 ? 'Excellent' : r === 4 ? 'Good' : r === 3 ? 'Average' : 'Poor'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trainer Rating (1-5)</label>
                <select
                  value={form.trainerRating}
                  onChange={(e) => setForm({ ...form, trainerRating: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold bg-white"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{r} Stars</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Organization Rating (1-5)</label>
                <select
                  value={form.organizationRating}
                  onChange={(e) => setForm({ ...form, organizationRating: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm font-bold bg-white"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{r} Stars</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Comments & Feedback</label>
              <textarea
                rows={3}
                placeholder="What did you learn or enjoy most about this session?"
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Suggestions for Future Editions</label>
              <textarea
                rows={2}
                placeholder="Any recommendations for future National Training Weeks?"
                value={form.suggestions}
                onChange={(e) => setForm({ ...form, suggestions: e.target.value })}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </form>
        </div>
      )}

      {/* Submitted Feedback History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Your Submitted Evaluations</h3>
        {myFeedback.length > 0 ? (
          <div className="space-y-3">
            {myFeedback.map((fb) => (
              <div key={fb._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-base">{fb.training?.title}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-600 font-semibold">
                  <span>Content: {fb.contentRating}/5 ★</span>
                  <span>Trainer: {fb.trainerRating}/5 ★</span>
                  <span>Org: {fb.organizationRating}/5 ★</span>
                </div>
                {fb.comments && <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg">"{fb.comments}"</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ChatBubbleLeftEllipsisIcon}
            title="No submitted evaluations yet"
            message="Evaluations will appear here once you attend sessions and submit feedback."
          />
        )}
      </div>

    </div>
  );
};

export default MyFeedback;
