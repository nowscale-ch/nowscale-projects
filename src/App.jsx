import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectNew from './pages/ProjectNew';
import ProjectDetail from './pages/ProjectDetail';
import ProjectSettings from './pages/ProjectSettings';
import MeetingDetail from './pages/MeetingDetail';

function ProtectedLayout() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="login-page"><div className="loading">Laden...</div></div>;
  if (!user || !profile) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<ProjectNew />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/settings" element={<ProjectSettings />} />
          <Route path="/projects/:id/meetings/:meetingId" element={<MeetingDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

function LoginPage() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="login-page"><div className="loading">Laden...</div></div>;
  if (user && profile) return <Navigate to="/" replace />;
  return <Login />;
}
