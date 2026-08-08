import React, { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const CONTACT_INFO = [
  { Icon: MapPinIcon,  label: 'Campus Location', value: 'Mogadishu, Somalia' },
  { Icon: EnvelopeIcon, label: 'Email Address',  value: 'ntw@hormuud.edu.so' },
  { Icon: PhoneIcon,   label: 'Inquiry Hotline', value: '+252 61 000 0000' },
  { Icon: GlobeAltIcon, label: 'Official Website', value: 'www.hormuud.edu.so' },
];

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a6b3c]/40 bg-white transition-shadow';

export const Contact = () => {
  const [form, setForm]         = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/public/contact', form);
      if (res.success) {
        toast.success('Message sent! We will get back to you soon.');
        setForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>

      {/* ── Page Hero ───────────────────────────────── */}
      <section
        className="relative py-24 text-white text-center"
        style={{ background: 'linear-gradient(135deg,#0d3d22 0%,#1a6b3c 50%,#155289 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06] bg-grid-pattern pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-3">Get In Touch</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Contact Program Committee</h1>
          <p className="text-emerald-100 text-sm max-w-xl mx-auto leading-relaxed">
            Have questions about registration, certificates, or session participation?
            Send us a message and we'll respond shortly.
          </p>
        </div>
      </section>

      {/* ── Contact Grid ────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* Left: info column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info card */}
              <div
                className="rounded-2xl p-8 text-white shadow-xl space-y-6"
                style={{ background: 'linear-gradient(135deg,#1a6b3c,#155289)' }}
              >
                <div>
                  <h2 className="text-2xl font-black">Hormuud University</h2>
                  <p className="text-emerald-200 text-sm mt-1">National Training Week Organizing Secretariat</p>
                </div>

                <div className="space-y-5">
                  {CONTACT_INFO.map(({ Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="p-2.5 bg-white/10 rounded-xl shrink-0">
                        <Icon className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-white mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ quick tips */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
                  Quick Answers
                </h3>
                {[
                  ['Is registration free?', 'Yes — all NTW 2026 sessions are 100% free for participants.'],
                  ['How do I get a certificate?', 'Attend the live session and mark your attendance via QR scan.'],
                  ['What platform is used?', 'Zoom, Google Meet, or Microsoft Teams depending on session.'],
                ].map(([q, a]) => (
                  <div key={q} className="space-y-1">
                    <p className="text-xs font-bold text-[#1a6b3c]">{q}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#1a6b3c] to-[#155289]" />
              <div className="p-8 sm:p-10">
                <h2 className="text-2xl font-black text-slate-900 mb-1">Send a Message</h2>
                <p className="text-slate-400 text-sm mb-8">
                  We usually respond within 1–2 business days.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={inputClass}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={inputClass}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Registration inquiry"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-2">
                      Message *
                    </label>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className={`${inputClass} resize-none`}
                      placeholder="Write your message here..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-black rounded-xl shadow transition-colors disabled:opacity-50 text-sm tracking-wide uppercase"
                  >
                    {submitting ? 'Sending…' : 'Send Message →'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;
