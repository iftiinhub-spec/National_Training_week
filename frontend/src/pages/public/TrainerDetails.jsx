import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCurrentEvent } from '../../context/EventContext';

const assetUrl = (value) => {
  if (!value) return null;
  return value.startsWith('http') ? value : `/${value.replace(/^\//, '')}`;
};

export const TrainerDetails = () => {
  const { id } = useParams();
  const { event } = useCurrentEvent();
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/public/trainers/${id}${event?._id ? `?event=${event._id}` : ''}`)
      .then((response) => {
        if (response.success) setTrainer(response.data.trainer);
      })
      .catch((requestError) => setError(requestError.message || 'Trainer profile could not be loaded.'))
      .finally(() => setLoading(false));
  }, [id, event?._id]);

  if (loading) return <div className="min-h-[70vh] bg-white pt-20"><LoadingSpinner label="Loading trainer profile..." /></div>;
  if (!trainer) return (
    <section className="min-h-[70vh] bg-white px-4 py-24 text-center">
      <h1 className="text-2xl font-black text-black">Trainer profile not found</h1>
      <p className="mt-3 text-sm text-black/60">{error}</p>
      <Link to="/" className="mt-6 inline-flex font-bold text-[#1da156] hover:underline">Return to Home</Link>
    </section>
  );

  const photo = assetUrl(trainer.photo);

  return (
    <div className="bg-white text-black">
      <section className="border-b border-black/10 bg-black px-4 py-12 text-white sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/75 transition hover:text-[#1da156]">
            <ArrowLeftIcon className="h-4 w-4" /> Back to Home
          </Link>
          <div className="mt-8 grid items-center gap-8 md:grid-cols-[300px_1fr] lg:gap-14">
            <div className="mx-auto aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl md:mx-0">
              {photo ? <img src={photo} alt={trainer.name} className="h-full w-full object-cover object-top" /> : (
                <div className="flex h-full items-center justify-center text-7xl font-black text-[#1da156]">{trainer.name?.charAt(0)}</div>
              )}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#1da156]">Trainer & Keynote Speaker</p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{trainer.name}</h1>
              {trainer.title && <p className="mt-4 text-lg font-bold text-[#1da156]">{trainer.title}</p>}
              {trainer.organization && <p className="mt-1 text-base font-semibold text-white/70">{trainer.organization}</p>}
              {trainer.expertise?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {trainer.expertise.map((item) => <span key={item} className="rounded-full border border-[#1da156]/50 bg-[#1da156]/15 px-3 py-1.5 text-xs font-bold text-white">{item}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[1fr_320px] lg:py-20">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#1da156]">Professional profile</p>
          <h2 className="mt-2 text-3xl font-black">About the trainer</h2>
          <p className="mt-6 whitespace-pre-line text-base leading-8 text-black/70">{trainer.biography || 'The complete professional biography will be published soon.'}</p>

          <div className="mt-14">
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#1da156]">Program contributions</p>
            <h2 className="mt-2 text-3xl font-black">Training sessions</h2>
            {trainer.sessions?.length ? (
              <div className="mt-6 grid gap-4">
                {trainer.sessions.map((session) => (
                  <Link key={session._id} to={`/trainings/${session._id}`} className="group rounded-2xl border border-black/10 p-5 transition hover:border-[#1da156] hover:shadow-lg sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#1da156]">
                      {session.eventDay && <span>Day {session.eventDay.dayNumber} · {session.eventDay.theme}</span>}
                      {session.category?.name && <span className="rounded-full bg-[#1da156]/10 px-2.5 py-1">{session.category.name}</span>}
                    </div>
                    <h3 className="mt-3 text-lg font-black transition group-hover:text-[#1da156]">{session.title}</h3>
                    {session.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/60">{session.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-black/60">
                      <span className="inline-flex items-center gap-1.5"><CalendarDaysIcon className="h-4 w-4 text-[#1da156]" />{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="inline-flex items-center gap-1.5"><ClockIcon className="h-4 w-4 text-[#1da156]" />{session.startTime}–{session.endTime}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <p className="mt-6 rounded-2xl border border-dashed border-black/20 p-8 text-center text-sm text-black/60">Assigned sessions will be published soon.</p>}
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">Contact information</h2>
          <div className="mt-5 space-y-4 text-sm">
            {trainer.email && <a href={`mailto:${trainer.email}`} className="flex items-start gap-3 break-all text-black/70 hover:text-[#1da156]"><EnvelopeIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#1da156]" />{trainer.email}</a>}
            {trainer.phone && <a href={`tel:${trainer.phone}`} className="flex items-center gap-3 text-black/70 hover:text-[#1da156]"><PhoneIcon className="h-5 w-5 shrink-0 text-[#1da156]" />{trainer.phone}</a>}
            {!trainer.email && !trainer.phone && <p className="text-black/60">Public contact details are not available.</p>}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default TrainerDetails;
