import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import TrainingCard from '../../components/common/TrainingCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  SparklesIcon,
  VideoCameraIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const Home = () => {
  const [featuredTrainings, setFeaturedTrainings] = useState([]);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainingsRes, eventRes] = await Promise.all([
          api.get('/public/featured-trainings'),
          api.get('/public/events'),
        ]);
        if (trainingsRes.success) setFeaturedTrainings(trainingsRes.data.trainings || []);
        if (eventRes.success && eventRes.data.events?.length > 0) {
          setEventData(eventRes.data.events[0]);
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative bg-[#1a6b3c] text-white overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-r from-[#124d2a] via-[#1a6b3c] to-[#155289] opacity-95"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs font-bold tracking-wide uppercase">
                <SparklesIcon className="w-4 h-4 text-emerald-300" />
                Annual Flagship Program 2026
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                National Training <span className="text-emerald-300">Week 2026</span>
              </h1>

              <p className="text-xl text-emerald-100 font-semibold max-w-2xl">
                Theme: <span className="text-white underline decoration-emerald-400 underline-offset-4">Artificial Intelligence for National Transformation</span>
              </p>

              <p className="text-slate-200 text-base sm:text-lg max-w-2xl leading-relaxed">
                Organized by Hormuud University, Mogadishu. Six intensive days of high-impact online technical training sessions led by top experts to empower students, professionals, developers, and high-school graduates across Somalia.
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/trainings"
                  className="px-7 py-3.5 rounded-xl bg-white text-[#1a6b3c] hover:bg-emerald-50 font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>Browse All Trainings</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>

                <Link
                  to="/signup"
                  className="px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                >
                  Create Participant Account
                </Link>
              </div>

              {/* Quick stats pills */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/15 max-w-lg mx-auto lg:mx-0">
                <div>
                  <span className="block text-2xl sm:text-3xl font-black text-white">6 Days</span>
                  <span className="text-xs text-emerald-200 uppercase font-medium">Themed Schedule</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl font-black text-white">18 Sessions</span>
                  <span className="text-xs text-emerald-200 uppercase font-medium">Expert Trainings</span>
                </div>
                <div>
                  <span className="block text-2xl sm:text-3xl font-black text-white">100% Free</span>
                  <span className="text-xs text-emerald-200 uppercase font-medium">Verified Certificate</span>
                </div>
              </div>
            </div>

            {/* Right Card / Key Highlights */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">
                    Event Overview
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/30 border border-emerald-400/40 text-xs font-bold text-emerald-200">
                    Registration Open
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-white/10 rounded-lg shrink-0 mt-0.5">
                      <CalendarDaysIcon className="w-6 h-6 text-emerald-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Event Dates</h4>
                      <p className="text-xs text-slate-200">September 14 – 19, 2026</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-white/10 rounded-lg shrink-0 mt-0.5">
                      <AcademicCapIcon className="w-6 h-6 text-emerald-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Delivery Mode</h4>
                      <p className="text-xs text-slate-200">Virtual Sessions (Zoom, Meet, Teams)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-white/10 rounded-lg shrink-0 mt-0.5">
                      <CheckBadgeIcon className="w-6 h-6 text-emerald-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Certificate Eligibility</h4>
                      <p className="text-xs text-slate-200">Attend live sessions & receive unique QR certificate</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/program"
                    className="block w-full text-center py-3 bg-[#155289] hover:bg-[#11426e] text-white font-bold rounded-lg text-sm transition-colors border border-blue-400/30"
                  >
                    View 6-Day Detailed Program
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURED TRAININGS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a6b3c]">
              Featured Opportunities
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Training Sessions
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Explore highlighted 2026 sessions with expert trainers. Cover images and 16:9 presentations.
            </p>
          </div>
          <Link
            to="/trainings"
            className="inline-flex items-center gap-1.5 font-bold text-sm text-[#1a6b3c] hover:text-[#124d2a]"
          >
            <span>View All Sessions</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading featured trainings..." />
        ) : featuredTrainings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTrainings.map((training) => (
              <TrainingCard key={training._id} training={training} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-100 rounded-xl p-12 text-center text-slate-500">
            No featured trainings published yet. Check back soon!
          </div>
        )}
      </section>

      {/* 6 THEMED DAYS PREVIEW */}
      <section className="bg-slate-100/80 py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#155289]">
              Program Structure
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              6 Days of Focused Innovation
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Each day of National Training Week 2026 focuses on a vital sector where Artificial Intelligence drives transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { day: 'Day 1', theme: 'AI Literacy Day', desc: 'Foundations of Artificial Intelligence, ethics, and essential digital readiness.' },
              { day: 'Day 2', theme: 'AI for Education Day', desc: 'Transforming teaching, learning, research, and personalized study tools.' },
              { day: 'Day 3', theme: 'AI for Business & Entrepreneurship', desc: 'Automating business operations, startups, and economic productivity.' },
              { day: 'Day 4', theme: 'AI for Community & Health', desc: 'Healthcare diagnostics, public service optimization, and social impact.' },
              { day: 'Day 5', theme: 'AI for Graduates Day', desc: 'Career pathing, technical portfolio development, and job market readiness.' },
              { day: 'Day 6', theme: 'AI and Innovation Day', desc: 'Advanced AI research, capstone session showcases, and national strategy.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-[#1a6b3c]">
                    {item.day}
                  </span>
                  <CalendarDaysIcon className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{item.theme}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/program"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a6b3c] hover:bg-[#124d2a] text-white text-sm font-bold rounded-lg shadow-xs transition-colors"
            >
              <span>Explore Complete 6-Day Schedule</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TARGET AUDIENCE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a6b3c]">
              Designed For Everyone
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Who Should Attend National Training Week?
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              National Training Week is structured to provide high-value knowledge regardless of your experience level. Sessions range from foundational literacy to technical developer deep-dives.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'University Students & Scholars', desc: 'Gain cutting-edge skills relevant to academic research and industry.' },
                { title: 'Fresh High-School Graduates', desc: 'Prepare for university entrance and discover future-proof tech careers.' },
                { title: 'Developers & IT Professionals', desc: 'Master practical AI implementation, APIs, ML algorithms, and tools.' },
                { title: 'Entrepreneurs & Public Professionals', desc: 'Learn how to leverage AI to scale business operations and services.' },
              ].map((aud, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                  <div className="p-1.5 bg-emerald-100 text-[#1a6b3c] rounded mt-0.5">
                    <UserGroupIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{aud.title}</h4>
                    <p className="text-slate-500 text-xs">{aud.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-gradient-to-br from-[#155289] to-[#1a6b3c] rounded-2xl p-8 text-white shadow-xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-emerald-300 border border-white/20">
                <ShieldCheckIcon className="w-4 h-4" /> Official Certification
              </div>

              <h3 className="text-2xl font-bold text-white">
                Earn Verified Hormuud University Certificates
              </h3>

              <p className="text-slate-200 text-sm leading-relaxed">
                Participants who register, attend sessions, and complete trainings receive an official Certificate of Completion with a unique verification code and QR identifier.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/verify-certificate"
                  className="px-5 py-3 rounded-lg bg-white text-[#155289] font-bold text-sm text-center shadow hover:bg-slate-100 transition-colors"
                >
                  Verify Certificate Code
                </Link>
                <Link
                  to="/recordings"
                  className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm text-center border border-white/20 transition-colors"
                >
                  Watch Recorded Sessions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
