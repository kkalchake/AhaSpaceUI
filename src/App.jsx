import { Routes, Route, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import CourseList from './pages/CourseList';
import CourseSections from './pages/CourseSections';
import SectionView from './pages/SectionView';
import ProtectedRoute from './components/ProtectedRoute';

function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, auth, logout } = useAuth();
  const isSuccess = searchParams.get('success');

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to AhaSpace</h1>
      {isSuccess && <h3 style={{ color: 'green' }}>Registration Successful! Please log in.</h3>}
      
      {isAuthenticated ? (
        <div>
          <p>Welcome back, {auth?.username}!</p>
          <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          <button onClick={() => navigate('/chat')} style={{ marginLeft: '10px' }}>AI Chat</button>
          <button onClick={() => navigate('/courses')} style={{ marginLeft: '10px' }}>Courses</button>
          <button onClick={logout} style={{ marginLeft: '10px' }}>Logout</button>
        </div>
      ) : (
        <div>
          <Link to="/register"><button style={{ marginRight: '10px' }}>Register</button></Link>
          <Link to="/login"><button>Sign In</button></Link>
        </div>
      )}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}