import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

/*
 * Replaces App.jsx's old inline Home(). Now a real product landing page:
 * logged-out visitors get a public-demo pitch instead of a bare "sign in or
 * register" prompt, since /courses is reachable without an account.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, auth, logout } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="auth-page">
        <h1 className="welcome-heading">Welcome to AhaSpace</h1>
        <div className="auth-hero">
          <p className="hero-subtext">Welcome back, {auth?.email}!</p>
          <div className="hero-actions">
            <button className="btn-secondary" onClick={() => navigate('/chat')}>AI Chat</button>
            <button className="btn-secondary" onClick={() => navigate('/courses')}>Courses</button>
            <button className="btn-secondary" onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1 className="welcome-heading">Welcome to AhaSpace</h1>

      <div className="auth-hero">
        <p className="hero-subtext">
          AhaSpace turns open courseware into structured, section-by-section lessons with an AI tutor built into every page.
        </p>
      </div>

      <div className="landing-features">
        <div className="landing-feature">
          <h3>Structured courses</h3>
          <p>Source material broken into phases and sections, so you always know what's next.</p>
        </div>
        <div className="landing-feature">
          <h3>Built-in AI tutor</h3>
          <p>Ask questions about the exact section you're reading, right where you're reading it.</p>
        </div>
        <div className="landing-feature">
          <h3>Track your progress</h3>
          <p>Create a free account to save chat history and unlock the full course catalog.</p>
        </div>
      </div>

      <p className="hero-secondary-link">
        <Link to="/courses">Browse Public Courses</Link>
      </p>
    </div>
  );
}
