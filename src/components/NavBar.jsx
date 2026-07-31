import React from 'react';
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
      <Link to="/" className="nav-brand">
        <span className="nav-brand-name">AhaSpace</span>{' '}
        <span className="nav-brand-tagline">— AI-powered learning</span>
      </Link>
      <div className="nav-links">
        {/*
          AI Agentic: Self Learning is still reachable - it's listed as the
          second entry in the /courses catalog (CourseList.jsx) - just not
          duplicated here in the nav bar anymore.
        */}
        {isAuthenticated ? (
          <>
            <Link to="/chat">AI Chat</Link>
            <Link to="/courses">Courses</Link>
            <button className="nav-link-button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Sign In</Link>
            <Link to="/register" className="nav-cta">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
