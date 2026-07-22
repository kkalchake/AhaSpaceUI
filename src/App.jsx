import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Chat from './pages/Chat';
import CourseList from './pages/CourseList';
import CourseSections from './pages/CourseSections';
import SectionView from './pages/SectionView';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import './pages/Auth.css';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, auth, logout } = useAuth();

  return (
    <div className="auth-page">
      <h1 className="welcome-heading">Welcome to AhaSpace</h1>

      {isAuthenticated ? (
        <div className="auth-hero">
          <p className="hero-subtext">Welcome back, {auth?.email}!</p>
          <div className="hero-actions">
            <button className="btn-secondary" onClick={() => navigate('/chat')}>AI Chat</button>
            <button className="btn-secondary" onClick={() => navigate('/courses')}>Courses</button>
            <button className="btn-secondary" onClick={logout}>Logout</button>
          </div>
        </div>
      ) : (
        <div className="auth-hero">
          <p className="hero-subtext">Sign in to keep going, or create an account to get started.</p>
          <Link to="/login" className="btn-primary">Sign In</Link>
          <p className="hero-secondary-link">
            New to AhaSpace? <Link to="/register">Create an account</Link>
          </p>
        </div>
      )}
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/courses" element={
          <ProtectedRoute>
            <CourseList />
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId" element={
          <ProtectedRoute>
            <CourseSections />
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId/sections/:sectionId" element={
          <ProtectedRoute>
            <SectionView />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}