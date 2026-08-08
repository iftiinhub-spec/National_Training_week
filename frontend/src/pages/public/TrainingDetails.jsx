import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon,
  BuildingOfficeIcon,
  LanguageIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export const TrainingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isParticipant } = useAuth();

  const [training, setTraining] = useState(null);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [userRegistration, setUserRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/public/trainings/${id}`);
      if (res.success && res.data) {
        setTraining(res.data.training);
        setRegisteredCount(res.data.registeredCount || 0);
      }
    } catch (err) {
      toast.error('Failed to load training details.');
    } finally {
      setLoading(false);
    }
  };

  // Check if participant is already registered
  const checkUserRegistration = async () => {
    if (isAuthenticated && isParticipant) {
      try {
        const res = await api.get('/participant/registrations');
        if (res.success && res.data) {
          const found = (res.data || []).find((r) => r.training?._id === id || r.training === id);
          if (found) setUserRegistration(found);
        }
      } catch (err) {
        // ignore
      }
    }
  };

  useEffect(() => {
    fetchDetails();
    checkUserRegistration();
  }, [id, isAuthenticated]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in or register an account to sign up for training.');
      navigate(`/signin?redirect=/trainings/${id}`);
      return;
    }

    if (!isParticipant) {
      toast.error('Only authenticated Participants can register for trainings.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/participant/registrations', { trainingId: id });
      if (res.success) {
        toast.success('Registration submitted! Status: Pending Approval.');
        setUserRegistration(res.data.registration);
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading training details..." />;
  if (!training) return <div className="p-12 text-center text-slate-500">Training not found.</div>;

  const {
    title,
    description,
    coverImage,
    trainer,
    event,
    eventDay,
    category,
    date,
    startTime,
    endTime,
    audience,
    level,
    language,
    capacity,
    status,
  } = training;

  const imageUrl = coverImage ? `/${coverImage}` : null;
  const isOpen = ['published', 'registration_open'].includes(status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Back button */}
      <Link to="/trainings" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a6b3c] hover:underline">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to All Trainings
      </Link>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Cover Image (16:9) */}
          <div className="relative aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a6b3c] to-[#155289] flex flex-col items-center justify-center p-8 text-center text-white">
                <AcademicCapIcon className="w-16 h-16 text-emerald-300 mb-3" />
                <span className="text-sm uppercase tracking-widest font-bold text-emerald-200">Hormuud University NTW</span>
                <h2 className="text-xl font-bold mt-2 max-w-md">{title}</h2>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <StatusBadge status={status} />
            </div>
            {eventDay && (
              <div className="absolute top-4 left-4 bg-slate-900/90 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-md border border-emerald-500/30">
                Day {eventDay.dayNumber}: {eventDay.theme}
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {category && (
                <span className="bg-emerald-100 text-[#1a6b3c] px-3 py-1 rounded-full">
                  {category.name}
                </span>
              )}
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full capitalize">
                {level} Level
              </span>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                {language || 'English'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              {title}
            </h1>

            <p className="text-sm text-slate-500 font-medium">
              Event Edition: <strong className="text-slate-800">{event?.name || 'National Training Week 2026'}</strong>
            </p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Session Overview & Description
            </h3>
            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {description || 'Full detailed curriculum description will be delivered live by the session trainer.'}
            </div>

            {audience && (
              <div className="pt-4 border-t border-slate-100 flex items-start gap-3">
                <UserGroupIcon className="w-5 h-5 text-[#1a6b3c] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Target Audience</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{audience}</p>
                </div>
              </div>
            )}
          </div>

          {/* Trainer / Speaker Profile Box */}
          {trainer && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a6b3c]">
                Assigned Trainer / Speaker
              </span>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                {trainer.photo ? (
                  <img
                    src={`/${trainer.photo}`}
                    alt={trainer.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-[#1a6b3c] flex items-center justify-center font-bold text-2xl shrink-0">
                    {trainer.name?.charAt(0)}
                  </div>
                )}

                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    {trainer.title ? `${trainer.title} ` : ''}{trainer.name}
                  </h3>
                  {trainer.organization && (
                    <p className="text-xs font-semibold text-[#155289] flex items-center gap-1.5">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      {trainer.organization}
                    </p>
                  )}
                  {trainer.biography && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {trainer.biography}
                    </p>
                  )}
                  {trainer.expertise?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {trainer.expertise.map((exp, i) => (
                        <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md">
                          {exp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Registration Card & Schedule Box */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Action Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-lg sticky top-28 space-y-6">
            
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Enrollment Action
              </span>

              {userRegistration ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    <span>Registered for this Training</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Status: <strong className="uppercase">{userRegistration.status}</strong>
                  </p>
                  <Link
                    to="/portal/trainings"
                    className="block w-full text-center py-2 bg-[#1a6b3c] text-white rounded-lg text-xs font-bold mt-2"
                  >
                    View in My Portal
                  </Link>
                </div>
              ) : isOpen ? (
                <button
                  onClick={handleRegister}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Register for Session'}
                </button>
              ) : (
                <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-4 text-xs font-medium text-center">
                  Registration for this training is currently closed.
                </div>
              )}
            </div>

            {/* Schedule Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Schedule & Platform Info
              </h4>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-[#1a6b3c] shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Date</span>
                    <span>{date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'TBA'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-[#1a6b3c] shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Time</span>
                    <span>{startTime || 'TBA'} {endTime ? `- ${endTime}` : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <LanguageIcon className="w-5 h-5 text-[#1a6b3c] shrink-0" />
                  <div>
                    <span className="block font-bold text-slate-900">Delivery & Language</span>
                    <span>Virtual Online ({language || 'English'})</span>
                  </div>
                </div>

                {capacity && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <UserGroupIcon className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="block font-bold text-slate-900">Approved Seats</span>
                      <span>{registeredCount} / {capacity} Seats Filled</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default TrainingDetails;
