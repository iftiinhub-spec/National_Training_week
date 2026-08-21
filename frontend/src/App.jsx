import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AppErrorBoundary from './components/common/AppErrorBoundary';
const ParticipantLayout = lazy(() => import('./pages/participant/ParticipantLayout'));
const ModeratorLayout = lazy(() => import('./pages/moderator/ModeratorLayout'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const TrainerLayout = lazy(() => import('./pages/trainer/TrainerLayout'));

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Program from './pages/public/Program';
import Trainings from './pages/public/Trainings';
import TrainingDetails from './pages/public/TrainingDetails';
import TrainerDetails from './pages/public/TrainerDetails';
import Recordings from './pages/public/Recordings';
import RecordingPlayer from './pages/public/RecordingPlayer';
import VerifyCertificate from './pages/public/VerifyCertificate';
import Contact from './pages/public/Contact';
import SignIn from './pages/public/SignIn';
import SignUp from './pages/public/SignUp';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import QRCheckIn from './pages/public/QRCheckIn';
import FAQ from './pages/public/FAQ';
import PastEditions from './pages/public/PastEditions';
import NotFound from './pages/public/NotFound';

// Participant Pages
const ParticipantDashboard = lazy(() => import('./pages/participant/ParticipantDashboard'));
const MyRegistrations = lazy(() => import('./pages/participant/MyRegistrations'));
const MyAttendance = lazy(() => import('./pages/participant/MyAttendance'));
const MyCertificates = lazy(() => import('./pages/participant/MyCertificates'));
const MyFeedback = lazy(() => import('./pages/participant/MyFeedback'));
const Profile = lazy(() => import('./pages/participant/Profile'));

// Moderator Pages
const ModeratorDashboard = lazy(() => import('./pages/moderator/ModeratorDashboard'));
const SessionOperation = lazy(() => import('./pages/moderator/SessionOperation'));
const AssignedSessions = lazy(() => import('./pages/moderator/AssignedSessions'));
const ModeratorProfile = lazy(() => import('./pages/moderator/ModeratorProfile'));
const TrainerDashboard = lazy(() => import('./pages/trainer/TrainerDashboard'));
const TrainerProfile = lazy(() => import('./pages/trainer/TrainerProfile'));
const TrainerCertificates = lazy(() => import('./pages/trainer/TrainerCertificates'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const EventsManagement = lazy(() => import('./pages/admin/EventsManagement'));
const TrainingsManagement = lazy(() => import('./pages/admin/TrainingsManagement'));
const TrainersManagement = lazy(() => import('./pages/admin/TrainersManagement'));
const ModeratorsManagement = lazy(() => import('./pages/admin/ModeratorsManagement'));
const ParticipantsManagement = lazy(() => import('./pages/admin/ParticipantsManagement'));
const RegistrationsManagement = lazy(() => import('./pages/admin/RegistrationsManagement'));
const AttendanceManagement = lazy(() => import('./pages/admin/AttendanceManagement'));
const CertificatesManagement = lazy(() => import('./pages/admin/CertificatesManagement'));
const RecordingsManagement = lazy(() => import('./pages/admin/RecordingsManagement'));
const CategoriesManagement = lazy(() => import('./pages/admin/CategoriesManagement'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const ContactMessages = lazy(() => import('./pages/admin/ContactMessages'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const FAQsManagement = lazy(() => import('./pages/admin/FAQsManagement'));
const SponsorsManagement = lazy(() => import('./pages/admin/SponsorsManagement'));

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">Checking your session...</div>;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [pathname, hash]);

  return null;
};

// Layout with Navbar and Footer for public pages
const PublicLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* pt-[88px] offsets the fixed navbar height for non-hero pages;
          Home.jsx handles its own hero offset via min-h-screen */}
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path="/"                    element={<Home />} />
          <Route path="/about"               element={<div className="pt-[88px]"><About /></div>} />
          <Route path="/program"             element={<div className="pt-[88px]"><Program /></div>} />
          <Route path="/trainings"           element={<div className="pt-[88px]"><Trainings /></div>} />
          <Route path="/trainings/:id"       element={<div className="pt-[88px]"><TrainingDetails /></div>} />
          <Route path="/trainers/:id"        element={<div className="pt-[88px]"><TrainerDetails /></div>} />
          <Route path="/recordings"          element={<div className="pt-[88px]"><Recordings /></div>} />
          <Route path="/recordings/:id"      element={<div className="pt-[88px]"><RecordingPlayer /></div>} />
          <Route path="/verify-certificate"  element={<div className="pt-[88px]"><VerifyCertificate /></div>} />
          <Route path="/contact"             element={<div className="pt-[88px]"><Contact /></div>} />
          <Route path="/faq"                 element={<div className="pt-[88px]"><FAQ /></div>} />
          <Route path="/past-editions"       element={<div className="pt-[88px]"><PastEditions /></div>} />
          <Route path="/signin"              element={<div className="pt-[88px]"><SignIn /></div>} />
          <Route path="/signup"              element={<div className="pt-[88px]"><SignUp /></div>} />
          <Route path="/forgot-password"     element={<div className="pt-[88px]"><ForgotPassword /></div>} />
          <Route path="/reset-password/:token" element={<div className="pt-[88px]"><ResetPassword /></div>} />
          <Route path="/qr-checkin"          element={<div className="pt-[88px]"><QRCheckIn /></div>} />
          <Route path="/trainer-application" element={<Navigate to="/signup?type=trainer" replace />} />
          <Route path="*"                    element={<div className="pt-[88px]"><NotFound /></div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export const App = () => {
  const { isDark } = useTheme();
  return (
    <AppErrorBoundary>
      <ScrollToTop />
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: isDark ? '#1a1a1a' : '#ffffff', color: isDark ? '#f7f7f7' : '#0f172a', border: `1px solid ${isDark ? '#3a3a3a' : '#e2e8f0'}` } }} />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">Loading…</div>}>
      <Routes>
        
        {/* Participant Portal Routes */}
        <Route
          path="/portal/*"
          element={
            <ProtectedRoute allowedRoles={['participant']}>
              <ParticipantLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ParticipantDashboard />} />
          <Route path="trainings" element={<MyRegistrations />} />
          <Route path="attendance" element={<MyAttendance />} />
          <Route path="certificates" element={<MyCertificates />} />
          <Route path="feedback" element={<MyFeedback />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Moderator Dashboard Routes */}
        <Route
          path="/moderator/*"
          element={
            <ProtectedRoute allowedRoles={['moderator']}>
              <ModeratorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ModeratorDashboard />} />
          <Route path="trainings" element={<AssignedSessions />} />
          <Route path="trainings/:trainingId" element={<SessionOperation />} />
          <Route path="profile" element={<ModeratorProfile />} />
        </Route>

        {/* Admin Command Center Routes */}
        <Route path="/trainer/*" element={<ProtectedRoute allowedRoles={['trainer']}><TrainerLayout /></ProtectedRoute>}>
          <Route index element={<TrainerDashboard />} />
          <Route path="sessions" element={<TrainerDashboard sessionsOnly />} />
          <Route path="certificates" element={<TrainerCertificates />} />
          <Route path="profile" element={<TrainerProfile />} />
        </Route>

        {/* Admin Command Center Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<EventsManagement />} />
          <Route path="trainings" element={<TrainingsManagement />} />
          <Route path="trainers" element={<TrainersManagement />} />
          <Route path="moderators" element={<ModeratorsManagement />} />
          <Route path="participants" element={<ParticipantsManagement />} />
          <Route path="registrations" element={<RegistrationsManagement />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="certificates" element={<CertificatesManagement />} />
          <Route path="recordings" element={<RecordingsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="contact-messages" element={<ContactMessages />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="faqs" element={<FAQsManagement />} />
          <Route path="sponsors" element={<SponsorsManagement />} />
        </Route>

        {/* Public Website Fallback */}
        <Route path="/*" element={<PublicLayout />} />

      </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
};

export default App;
