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
      <Link to="/" className="nav-brand">AhaSpace</Link>
      {/*
        Logged-out visitors get no Sign In / Register links here — the
        landing page's single CTA block and the section chat gate's
        SignInPromptModal are the routes back to auth now, so the nav bar
        doesn't need to duplicate them on every public page.
      */}
      <div className="nav-links">
        {isAuthenticated && (
          <>
            <Link to="/chat">AI Chat</Link>
            <Link to="/courses">Courses</Link>
            <button className="nav-link-button" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
