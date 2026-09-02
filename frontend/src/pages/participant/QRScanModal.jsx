import React, { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { QrCodeIcon, XMarkIcon } from '@icons';
import ButtonSpinner from '../../components/common/ButtonSpinner';

export const QRScanModal = ({ isOpen, onClose, onSuccess }) => {
  const [trainingId, setTrainingId] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trainingId || !sessionToken) {
      toast.error('Training ID and Session Token are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/participant/qr-checkin', {
        trainingId: trainingId.trim(),
        sessionToken: sessionToken.trim(),
      });

      if (res.success) {
        toast.success('Check-in successful! Your attendance status is marked PRESENT.');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'QR Check-in failed. Please verify the session is active.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <QrCodeIcon className="w-6 h-6 text-[#1a6b3c]" />
            Session QR Attendance Check-In
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Enter or paste the QR check-in token displayed on screen by your training Moderator during the live session.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Training Session ID
            </label>
            <input
              type="text"
              placeholder="Paste training ID"
              value={trainingId}
              onChange={(e) => setTrainingId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              QR Session Token
            </label>
            <input
              type="text"
              placeholder="Paste QR token"
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-xs rounded-xl shadow transition-colors disabled:opacity-50"
          >
            {submitting ? <><ButtonSpinner /> Verifying Check-In...</> : 'Confirm Attendance Check-In'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default QRScanModal;
