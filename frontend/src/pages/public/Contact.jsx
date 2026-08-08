import React, { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const CONTACT_INFO = [
  { Icon: MapPinIcon,  label: 'Location', value: 'Mogadishu, Somalia' },
  { Icon: EnvelopeIcon, label: 'Email Address',  value: 'ntw@trainingweek.so' },
  { Icon: PhoneIcon,   label: 'Inquiry Hotline', value: '+252 61 000 0000' },
  { Icon: GlobeAltIcon, label: 'Official Website', value: 'www.nationaltrainingweek.so' },
];

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1da156]/40 bg-white text-black transition-shadow';

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
    <div className="bg-white min-h-screen">

      {/* ── Page Hero ───────────────────────────────── */}
      <section className="relative py-24 text-white text-center bg-[#1da156]">
        <div className="absolute inset-0 opacity-10 bg-grid-pattern pointer-events-none" />
        <div className="relative max-w-2xl mx-auto px-4 z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-white mb-3">Get In Touch</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Contact Program Committee</h1>
          <p className="text-white text-sm max-w-xl mx-auto leading-relaxed">
            Have questions about registration, certificates, or session participation?
            Send us a message and we'll respond shortly.
          </p>
        </div>
      </section>

      {/* ── Contact Grid ────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* Left: info column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info card */}
              <div className="rounded-2xl p-8 text-white shadow-xl space-y-6 bg-[#1da156]">
                <div>
                  <h2 className="text-2xl font-black">National Training Week</h2>
                  <p className="text-white/80 text-sm mt-1">Organizing Secretariat</p>
                </div>

                <div className="space-y-5">
                  {CONTACT_INFO.map(({ Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="p-2.5 bg-white/10 rounded-xl shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-white mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ quick tips */}
              <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-black text-black uppercase tracking-wide border-b border-black/10 pb-3">
                  Quick Answers
                </h3>
                {[
                  ['Is registration free?', 'Yes — all NTW 2026 sessions are 100% free for participants.'],
                  ['How do I get a certificate?', 'Attend the live session and mark your attendance via QR scan.'],
                  ['What platform is used?', 'Zoom, Google Meet, or Microsoft Teams depending on session.'],
                ].map(([q, a]) => (
                  <div key={q} className="space-y-1">
                    <p className="text-xs font-bold text-[#1da156]">{q}</p>
                    <p className="text-xs text-black/70 leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-[#1da156]" />
              <div className="p-8 sm:p-10">
                <h2 className="text-2xl font-black text-black mb-1">Send a Message</h2>
                <p className="text-black/60 text-sm mb-8">
                  We usually respond within 1–2 business days.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-black uppercase tracking-wide mb-2">
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
                      <label className="block text-xs font-black text-black uppercase tracking-wide mb-2">
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
                    <label className="block text-xs font-black text-black uppercase tracking-wide mb-2">
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
                    <label className="block text-xs font-black text-black uppercase tracking-wide mb-2">
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
                    className="w-full py-3.5 bg-[#1da156] hover:bg-black text-white font-black rounded-xl shadow transition-colors disabled:opacity-50 text-sm tracking-wide uppercase"
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
