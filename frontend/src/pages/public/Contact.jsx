import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import ButtonSpinner from "../../components/common/ButtonSpinner";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@icons";
import PublicPageHeader from "../../components/common/PublicPageHeader";

const CONTACT_INFO = [
  {
    Icon: MapPinIcon,
    value: 'Daru Shura Campus, Villa Baidoa, Wadajir, Mogadishu, Somalia'
  },
  {
    Icon: EnvelopeIcon,
    value: 'info@ntw.hu.edu.so',
    href: 'mailto:info@ntw.hu.edu.so'
  },
  {
    Icon: PhoneIcon,
    value: '+252 613 311119 / +2521 858117',
    href: 'tel:+252613311119'
  },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1da156]/40 bg-white text-black transition-shadow";

export const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/public/contact", form);
      if (res.success) {
        toast.success("Message sent! We will get back to you soon.");
        setForm({ name: "", email: "", subject: "", message: "" });
      }
    } catch (err) {
      toast.error(err.message || "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* ── Page Hero ───────────────────────────────── */}
      <PublicPageHeader
        eyebrow="Get in touch"
        title="Contact the Program Committee"
        description="Ask about registration, session participation, certificates, accessibility, or general program support."
      />

      {/* ── Contact Grid ────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Left: info column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info card */}
              <div className="rounded-2xl p-8 text-white shadow-xl space-y-6 bg-[#15803d]">
                <div>
                  <h2 className="text-2xl font-black">
                    National Training Week
                  </h2>
                  <p className="text-white text-sm mt-1">
                    Organizing Secretariat
                  </p>
                </div>

                <div className="space-y-5">
                  {CONTACT_INFO.map(({ Icon, value, href }) => (
                    <div key={value} className="flex items-center gap-4">
                      <div className="p-2.5 bg-white/10 rounded-xl shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      <div>
                        {href ? (
                          <a
                            href={href}
                            className="block text-sm text-white hover:underline"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="text-sm text-white">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-black text-black">
                  Looking for a quick answer?
                </h3>
                <p className="mt-3 text-sm leading-6 text-black/70">
                  Read answers about registration, attendance, certificates, and
                  training sessions before sending a message.
                </p>
                <Link
                  to="/faq"
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1a6b3c] px-5 text-sm font-bold text-[#1a6b3c] transition hover:bg-[#1a6b3c] hover:text-white"
                >
                  View FAQs
                </Link>
              </div>
            </div>

            {/* Right: form */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-black/10 shadow-sm overflow-hidden">
              <div className="p-8 sm:p-10">
                <h2 className="text-2xl font-black text-black mb-1">
                  Send a Message
                </h2>
                <p className="text-black/60 text-sm mb-8">
                  We usually respond within 1–2 business days.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-black">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className={inputClass}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-black">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className={inputClass}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-black">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      className={inputClass}
                      placeholder="e.g. Registration inquiry"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-black">
                      Message *
                    </label>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      className={`${inputClass} resize-none`}
                      placeholder="Write your message here..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#15803d] py-3.5 text-sm font-black text-white shadow transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting && <ButtonSpinner />}
                    {submitting ? "Sending…" : "Send Message →"}
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
