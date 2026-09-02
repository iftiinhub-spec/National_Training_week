import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import FAQAccordion from '../../components/common/FAQAccordion';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PublicPageHeader from '../../components/common/PublicPageHeader';

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => { api.get('/public/faqs').then((response) => setFaqs(response.data?.faqs || [])).catch(() => setFailed(true)).finally(() => setLoading(false)); }, []);

  return <div className="min-h-screen bg-white">
    <PublicPageHeader eyebrow="Help Center" title="Frequently Asked Questions" description="Find clear answers about registration, training sessions, attendance, certificates, and National Training Week services." />
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-8 lg:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
        <div className="lg:pt-5">
          <h2 className="text-3xl font-black tracking-tight text-slate-950">Answers when you need them</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">Select a question to read its answer. The information is maintained by the National Training Week administration team.</p>
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="font-bold text-slate-950">Still need help?</p><p className="mt-2 text-sm leading-6 text-slate-600">Send your question to the program committee and our team will assist you.</p>
            <Link to="/contact" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1a6b3c] px-5 text-sm font-bold text-white transition hover:bg-black">Contact Us</Link>
          </div>
        </div>
        <div aria-live="polite">
          {loading ? <LoadingSpinner label="Loading frequently asked questions..." /> : failed ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Frequently asked questions could not be loaded. Please try again later.</div> : faqs.length ? <FAQAccordion faqs={faqs} /> : <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center"><h2 className="font-bold text-slate-950">No FAQs published yet</h2><p className="mt-2 text-sm text-slate-600">Please contact the program committee if you need assistance.</p></div>}
        </div>
      </div>
    </section>
  </div>;
}
