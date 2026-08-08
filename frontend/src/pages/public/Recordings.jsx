import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { VideoCameraIcon, PlayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export const Recordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const res = await api.get('/public/recordings');
        if (res.success) {
          setRecordings(res.data || []);
        }
      } catch (err) {
        console.error('Error loading recordings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#155289] to-[#1a6b3c] text-white rounded-2xl p-8 md:p-10 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
          Free Public Learning Library
        </span>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">
          Recorded Training Sessions
        </h1>
        <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl">
          Access published video recordings from completed National Training Week sessions for open learning and review.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading published recordings..." />
      ) : recordings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((recording) => (
            <div
              key={recording._id}
              className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Thumbnail Container (16:9) */}
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                {recording.thumbnail ? (
                  <img
                    src={`/${recording.thumbnail}`}
                    alt={recording.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#124d2a] to-[#155289] flex flex-col items-center justify-center p-6 text-white text-center">
                    <VideoCameraIcon className="w-12 h-12 text-emerald-300 mb-2 opacity-80" />
                    <span className="text-xs uppercase font-bold text-emerald-200">
                      HU NTW Video Recording
                    </span>
                  </div>
                )}

                {/* Play Icon Overlay */}
                <a
                  href={recording.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <PlayIcon className="w-7 h-7 ml-0.5" />
                  </div>
                </a>
              </div>

              {/* Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {recording.training?.event && (
                    <span className="text-xs font-semibold text-[#1a6b3c] block mb-1">
                      {recording.training.event.name}
                    </span>
                  )}
                  <h3 className="font-bold text-slate-900 text-lg line-clamp-2 mb-2">
                    {recording.title}
                  </h3>
                  {recording.description && (
                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-4">
                      {recording.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={recording.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center bg-slate-900 hover:bg-[#1a6b3c] text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Watch Recording</span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={VideoCameraIcon}
          title="No published recordings available"
          message="Recordings will appear here once training sessions are completed and published."
        />
      )}

    </div>
  );
};

export default Recordings;
