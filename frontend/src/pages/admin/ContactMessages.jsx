import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { CheckIcon, TrashIcon } from '@icons';

export const ContactMessages = () => {
  const confirmAction = useConfirmDialog();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/admin/contact-messages');
      if (res.success) setMessages(res.data || []);
    } catch (err) {
      toast.error('Failed to load contact messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const res = await api.patch(`/admin/contact-messages/${id}/read`);
      if (res.success) {
        toast.success('Marked as read.');
        fetchMessages();
      }
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!await confirmAction({ title: 'Delete contact message?', message: 'This message will be permanently removed and cannot be recovered.', confirmLabel: 'Delete message' })) return;
    try {
      await api.delete(`/admin/contact-messages/${id}`);
      toast.success('Message deleted.');
      fetchMessages();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading public contact messages..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Public Contact Messages</h1>
        <p className="text-xs text-slate-500 mt-1">
          Inquiries submitted by visitors through the public Contact Us page.
        </p>
      </div>

      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`p-6 rounded-2xl border shadow-xs space-y-3 transition-colors ${
              msg.isRead ? 'bg-white border-slate-200' : 'bg-emerald-50/50 border-emerald-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{msg.name}</h4>
                <p className="text-xs text-slate-500">{msg.email}</p>
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-[#1a6b3c] uppercase block mb-1">Subject: {msg.subject}</span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{msg.message}</p>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              {!msg.isRead && (
                <button
                  onClick={() => handleMarkRead(msg._id)}
                  className="px-3 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 flex items-center gap-1"
                >
                  <CheckIcon className="w-3.5 h-3.5" /> Mark Read
                </button>
              )}
              <button
                onClick={() => handleDelete(msg._id)}
                className="px-3 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold rounded flex items-center gap-1"
              >
                <TrashIcon className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactMessages;
