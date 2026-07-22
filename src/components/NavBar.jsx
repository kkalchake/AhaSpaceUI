import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NavBar.css';

export default function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="nav-bar">
      <Link to="/" className="nav-brand">AhaSpace</Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/chat">AI Chat</Link>
            <Link to="/courses">Courses</Link>
            <button className="nav-link-button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
