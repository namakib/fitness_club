import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import MemberDashboard from './pages/member/Dashboard';
import Profile from './pages/member/Profile';
import HealthHistory from './pages/member/HealthHistory';
import TrainerDashboard from './pages/trainer/Dashboard';
import Schedule from './pages/trainer/Schedule';
import Availability from './pages/trainer/Availability';
import AdminDashboard from './pages/admin/Dashboard';
import RoomBooking from './pages/admin/RoomBooking';
import Equipment from './pages/admin/Equipment';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Layout />}>
          <Route path="/member/dashboard" element={<ProtectedRoute role="member"><MemberDashboard /></ProtectedRoute>} />
          <Route path="/member/profile" element={<ProtectedRoute role="member"><Profile /></ProtectedRoute>} />
          <Route path="/member/health-history" element={<ProtectedRoute role="member"><HealthHistory /></ProtectedRoute>} />
          <Route path="/trainer/dashboard" element={<ProtectedRoute role="trainer"><TrainerDashboard /></ProtectedRoute>} />
          <Route path="/trainer/schedule" element={<ProtectedRoute role="trainer"><Schedule /></ProtectedRoute>} />
          <Route path="/trainer/availability" element={<ProtectedRoute role="trainer"><Availability /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/room-booking" element={<ProtectedRoute role="admin"><RoomBooking /></ProtectedRoute>} />
          <Route path="/admin/equipment" element={<ProtectedRoute role="admin"><Equipment /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
