import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PublicEmptyState from '../../components/common/PublicEmptyState';

const mediaUrl = (value) => value?.startsWith('http') ? value : value ? `/${value.replace(/^\//, '')}` : '';

const getPlayer = (url = '') => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    let youtubeId = '';
    if (host === 'youtu.be') youtubeId = parsed.pathname.split('/').filter(Boolean)[0] || '';
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      youtubeId = parsed.pathname === '/watch'
        ? parsed.searchParams.get('v') || ''
        : parsed.pathname.split('/')[2] || '';
    }
    if (youtubeId) return { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${youtubeId}`, youtubeId };
    return { type: 'video', src: url };
  } catch { return null; }
};

export const RecordingPlayer = () => {
  const { id } = useParams();
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setStarted(false);
    api.get(`/public/recordings/${id}`)
      .then((res) => { if (res.success) setRecording(res.data.recording); })
      .catch(() => setRecording(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-[70vh] bg-slate-950 pt-20"><LoadingSpinner label="Loading recording..." /></div>;
  if (!recording) return <div className="mx-auto max-w-4xl px-4 py-20"><PublicEmptyState title="Recording unavailable" description="This recording may have been unpublished or removed." /></div>;

  const player = getPlayer(recording.url);
  const poster = recording.thumbnail
    ? mediaUrl(recording.thumbnail)
    : player?.youtubeId
      ? `https://i.ytimg.com/vi/${player.youtubeId}/maxresdefault.jpg`
      : mediaUrl(recording.training?.coverImage);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <Link to="/recordings" className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white"><ArrowLeftIcon className="h-4 w-4" /> Back to recordings</Link>

        <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          {player?.type === 'youtube' && !started ? (
            <button type="button" onClick={() => setStarted(true)} aria-label={`Play ${recording.title}`} className="group relative h-full w-full bg-slate-900">
              <img src={poster} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1da156] text-white shadow-2xl group-hover:scale-105">
                  <PlayIcon className="ml-1 h-10 w-10" />
                </span>
              </span>
            </button>
          ) : player?.type === 'youtube' ? (
            <iframe src={`${player.src}?autoplay=1&rel=0&loop=1&playlist=${player.youtubeId}&playsinline=1`} title={recording.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          ) : player ? (
            <video src={player.src} controls playsInline preload="metadata" poster={poster || undefined} className="h-full w-full" />
          ) : null}
        </div>

        <div className="mt-8 max-w-3xl">
          {recording.training?.event && <p className="text-sm font-bold text-[#39d98a]">{recording.training.event.name}</p>}
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{recording.title}</h1>
          {recording.description && <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">{recording.description}</p>}
        </div>
      </div>
    </main>
  );
};

export default RecordingPlayer;
