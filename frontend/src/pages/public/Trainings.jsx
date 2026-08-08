import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import TrainingCard from '../../components/common/TrainingCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

export const Trainings = () => {
  const [trainings, setTrainings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await api.get(`/public/trainings?${params.toString()}`);
      if (res.success) {
        setTrainings(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching trainings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const catRes = await api.get('/admin/categories?activeOnly=true');
        if (catRes.success) setCategories(catRes.data.categories || []);
      } catch (err) {
        // public fallback category fetch if admin endpoint restricted
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [selectedCategory, selectedLevel, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTrainings();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#1a6b3c]">
          Explore Curriculum
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
          National Training Sessions
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-2xl">
          Browse published training sessions for National Training Week 2026. Register for sessions to attend and receive eligible certificates.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by session title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Levels</option>
            <option value="general">General</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Open Statuses</option>
            <option value="registration_open">Registration Open</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#1a6b3c] hover:bg-[#124d2a] text-white font-bold text-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Grid List */}
      {loading ? (
        <LoadingSpinner label="Loading training sessions..." />
      ) : trainings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map((training) => (
            <TrainingCard key={training._id} training={training} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No training sessions found"
          message="Try adjusting your search terms or filter criteria."
          action={
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedLevel('');
                setSelectedStatus('');
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
            >
              Reset All Filters
            </button>
          }
        />
      )}

    </div>
  );
};

export default Trainings;
