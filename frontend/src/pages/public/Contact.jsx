import React, { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/public/contact', form);
      if (res.success) {
        toast.success('Your message has been sent successfully. We will get back to you soon!');
        setForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1a6b3c]">
          Get In Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contact Program Committee
        </h1>
        <p className="text-slate-600 text-sm">
          Have questions about National Training Week 2026 registration, certificates, or session participation? Send us a message.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Contact Info Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1a6b3c] to-[#155289] text-white rounded-2xl p-8 shadow-xl space-y-6">
          <h3 className="text-2xl font-bold">Hormuud University</h3>
          <p className="text-emerald-100 text-sm leading-relaxed">
            National Training Week Organizing Secretariat
          </p>

          <div className="space-y-4 pt-4 text-sm text-slate-200">
            <div className="flex items-start gap-3">
              <MapPinIcon className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white">Campus Location</strong>
                <span>Mogadishu, Somalia</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <EnvelopeIcon className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white">Email Address</strong>
                <span>ntw@hormuud.edu.so</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <PhoneIcon className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white">Inquiry Hotline</strong>
                <span>+252 61 000 0000</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <GlobeAltIcon className="w-6 h-6 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white">Official Website</strong>
                <span>www.hormuud.edu.so</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-8 border border-slate-200 shadow-md space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Send a Contact Message</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message</label>
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-sm rounded-xl shadow transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending Message...' : 'Submit Message'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Contact;
