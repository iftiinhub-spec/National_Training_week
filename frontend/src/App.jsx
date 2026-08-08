import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ParticipantLayout from './pages/participant/ParticipantLayout';
import ModeratorLayout from './pages/moderator/ModeratorLayout';
import AdminLayout from './pages/admin/AdminLayout';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Program from './pages/public/Program';
import Trainings from './pages/public/Trainings';
import TrainingDetails from './pages/public/TrainingDetails';
import Recordings from './pages/public/Recordings';
import VerifyCertificate from './pages/public/VerifyCertificate';
import Contact from './pages/public/Contact';
import SignIn from './pages/public/SignIn';
import SignUp from './pages/public/SignUp';

// Participant Pages
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import MyRegistrations from './pages/participant/MyRegistrations';
import MyAttendance from './pages/participant/MyAttendance';
import MyCertificates from './pages/participant/MyCertificates';
import MyFeedback from './pages/participant/MyFeedback';
import Profile from './pages/participant/Profile';

// Moderator Pages
import ModeratorDashboard from './pages/moderator/ModeratorDashboard';
import SessionOperation from './pages/moderator/SessionOperation';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import EventsManagement from './pages/admin/EventsManagement';
import TrainingsManagement from './pages/admin/TrainingsManagement';
import TrainersManagement from './pages/admin/TrainersManagement';
import ModeratorsManagement from './pages/admin/ModeratorsManagement';
import RegistrationsManagement from './pages/admin/RegistrationsManagement';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import CertificatesManagement from './pages/admin/CertificatesManagement';
import RecordingsManagement from './pages/admin/RecordingsManagement';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import Reports from './pages/admin/Reports';
import ContactMessages from './pages/admin/ContactMessages';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Layout with Navbar and Footer for public pages
const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/program" element={<Program />} />
          <Route path="/trainings" element={<Trainings />} />
          <Route path="/trainings/:id" element={<TrainingDetails />} />
          <Route path="/recordings" element={<Recordings />} />
          <Route path="/verify-certificate" element={<VerifyCertificate />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export const App = () => {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
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
          <Route path="trainings" element={<ModeratorDashboard />} />
          <Route path="trainings/:trainingId" element={<SessionOperation />} />
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
          <Route path="registrations" element={<RegistrationsManagement />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="certificates" element={<CertificatesManagement />} />
          <Route path="recordings" element={<RecordingsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="contact-messages" element={<ContactMessages />} />
        </Route>

        {/* Public Website Fallback */}
        <Route path="/*" element={<PublicLayout />} />

      </Routes>
    </>
  );
};

export default App;
