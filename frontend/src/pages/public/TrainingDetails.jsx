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
  if (!training) return <div className="p-12 text-center text-black/60">Training not found.</div>;

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-white min-h-screen">
      
      {/* Back button */}
      <Link to="/trainings" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1da156] hover:underline">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to All Trainings
      </Link>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Cover Image */}
          <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-lg border border-black/10">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8 text-center">
                <img src="/logo.png" alt="National Training Week" className="h-28 w-auto object-contain opacity-80 mb-3" />
                <h2 className="text-xl font-bold mt-2 max-w-md text-black">{title}</h2>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <StatusBadge status={status} />
            </div>
            {eventDay && (
              <div className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-md border border-[#1da156]">
                Day {eventDay.dayNumber}: {eventDay.theme}
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {category && (
                <span className="bg-[#1da156] text-white px-3 py-1 rounded-full">
                  {category.name}
                </span>
              )}
              <span className="bg-black/10 text-black px-3 py-1 rounded-full capitalize">
                {level} Level
              </span>
              <span className="bg-black/10 text-black px-3 py-1 rounded-full">
                {language || 'English'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-black leading-tight">
              {title}
            </h1>

            <p className="text-sm text-black/70 font-medium">
              Event Edition: <strong className="text-black">{event?.name || 'National Training Week 2026'}</strong>
            </p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/10 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-black border-b border-black/10 pb-3">
              Session Overview & Description
            </h3>
            <div className="text-black/80 text-sm leading-relaxed whitespace-pre-line">
              {description || 'Full detailed curriculum description will be delivered live by the session trainer.'}
            </div>

            {audience && (
              <div className="pt-4 border-t border-black/10 flex items-start gap-3">
                <UserGroupIcon className="w-5 h-5 text-[#1da156] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-black uppercase">Target Audience</h4>
                  <p className="text-xs text-black/70 mt-0.5">{audience}</p>
                </div>
              </div>
            )}
          </div>

          {/* Trainer / Speaker Profile Box */}
          {trainer && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/10 shadow-xs space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1da156]">
                Assigned Trainer / Speaker
              </span>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                {trainer.photo ? (
                  <img
                    src={`/${trainer.photo}`}
                    alt={trainer.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#1da156] shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#1da156] text-white flex items-center justify-center font-bold text-2xl shrink-0">
                    {trainer.name?.charAt(0)}
                  </div>
                )}

                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-bold text-black">
                    {trainer.title ? `${trainer.title} ` : ''}{trainer.name}
                  </h3>
                  {trainer.organization && (
                    <p className="text-xs font-semibold text-[#1da156] flex items-center gap-1.5">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      {trainer.organization}
                    </p>
                  )}
                  {trainer.biography && (
                    <p className="text-xs text-black/70 leading-relaxed pt-1">
                      {trainer.biography}
                    </p>
                  )}
                  {trainer.expertise?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {trainer.expertise.map((exp, i) => (
                        <span key={i} className="text-[11px] bg-black/10 text-black px-2.5 py-0.5 rounded-md">
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
          <div className="bg-white rounded-2xl p-6 border border-black/10 shadow-lg sticky top-28 space-y-6">
            
            <div className="space-y-3 border-b border-black/10 pb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-black/60">
                Enrollment Action
              </span>

              {userRegistration ? (
                <div className="bg-white border border-[#1da156] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#1da156] font-bold text-sm">
                    <CheckCircleIcon className="w-5 h-5 text-[#1da156]" />
                    <span>Registered for this Training</span>
                  </div>
                  <p className="text-xs text-black/80">
                    Status: <strong className="uppercase">{userRegistration.status}</strong>
                  </p>
                  <Link
                    to="/portal/trainings"
                    className="block w-full text-center py-2 bg-[#1da156] text-white rounded-lg text-xs font-bold mt-2"
                  >
                    View in My Portal
                  </Link>
                </div>
              ) : isOpen ? (
                <button
                  onClick={handleRegister}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-[#1da156] hover:bg-black text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Register for Session'}
                </button>
              ) : (
                <div className="bg-white text-black border border-black/20 rounded-xl p-4 text-xs font-medium text-center">
                  Registration for this training is currently closed.
                </div>
              )}
            </div>

            {/* Schedule Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                Schedule & Platform Info
              </h4>

              <div className="space-y-3 text-xs text-black/80">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-[#1da156] shrink-0" />
                  <div>
                    <span className="block font-bold text-black">Date</span>
                    <span>{date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'TBA'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-[#1da156] shrink-0" />
                  <div>
                    <span className="block font-bold text-black">Time</span>
                    <span>{startTime || 'TBA'} {endTime ? `- ${endTime}` : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <LanguageIcon className="w-5 h-5 text-[#1da156] shrink-0" />
                  <div>
                    <span className="block font-bold text-black">Delivery & Language</span>
                    <span>Virtual Online ({language || 'English'})</span>
                  </div>
                </div>

                {capacity && (
                  <div className="flex items-center gap-3 pt-2 border-t border-black/10">
                    <UserGroupIcon className="w-5 h-5 text-[#1da156] shrink-0" />
                    <div>
                      <span className="block font-bold text-black">Approved Seats</span>
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
