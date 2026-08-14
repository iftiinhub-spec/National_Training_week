import React, { useState } from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function FAQAccordion({ faqs }) {
  const [openId, setOpenId] = useState(faqs[0]?._id || null);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {faqs.map((faq) => {
        const open = openId === faq._id;
        const panelId = `faq-answer-${faq._id}`;
        return (
          <article key={faq._id} className="border-b border-slate-200 last:border-b-0">
            <h2><button type="button" className="flex min-h-16 w-full items-start justify-between gap-5 px-5 py-5 text-left transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a6b3c] sm:px-6" onClick={() => setOpenId(open ? null : faq._id)} aria-expanded={open} aria-controls={panelId}>
              <span className="font-bold leading-6 text-slate-950">{faq.question}</span>
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-slate-950" aria-hidden="true">{open ? <MinusIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}</span>
            </button></h2>
            {open && <div id={panelId} role="region" className="px-5 pb-5 pr-14 sm:px-6 sm:pb-6 sm:pr-16">
              {faq.category && <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#1a6b3c]">{faq.category}</p>}
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{faq.answer}</p>
            </div>}
          </article>
        );
      })}
    </div>
  );
}
