import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesBase, authHeaders } from '../api/courseApi';
import './CoursePages.css';

/*
 * AI Agentic: Self Learning is a fully static page (AgenticLearning.jsx)
 * with no backend Course/Phase/Section entity behind it - this entry is
 * spliced into the rendered list client-side, not fetched from the API, so
 * it appears as the catalog's second entry without implying a real
 * Phase/Section drill-down exists (its `href` routes straight to
 * /agentic-learning instead of /courses/:id).
 */
const AGENTIC_LEARNING_ENTRY = {
  id: 'agentic-learning',
  title: 'AI Agentic: Self Learning',
  description: 'Curated reading, videos, and code references for self-directed agentic AI learning.',
  href: '/agentic-learning'
};

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(coursesBase(isAuthenticated), {
          headers: authHeaders(auth)
        });
        if (res.ok) {
          setCourses(await res.json());
        } else if (res.status === 401 || res.status === 403) {
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to load courses.');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, [auth?.token, isAuthenticated]);

  // Spliced in at index 1 so it reads as "the second course" whenever a real
  // course exists, or as the sole entry when the real catalog is empty -
  // either way it's always present, for both auth tiers.
  const displayCourses = [
    ...courses.slice(0, 1),
    AGENTIC_LEARNING_ENTRY,
    ...courses.slice(1)
  ];

  return (
    <div className="course-page">
      <nav className="course-page-nav" aria-label="Page navigation">
        <Link to="/">← Home</Link>
      </nav>

      {isAuthenticated ? (
        <h2 className="course-page-heading">Courses</h2>
      ) : (
        <h2 className="course-page-heading">Public courses</h2>
      )}

      {error && (
        <div className="error-banner" style={{ marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {!isLoading && courses.length === 0 && !error && (
        <p className="course-page-status">
          {isAuthenticated ? 'No courses available yet.' : 'No public courses available yet. Sign in to see more.'}
        </p>
      )}

      {isLoading ? (
        <p className="course-page-status">Loading courses...</p>
      ) : (
        <div className="course-card-list">
          {displayCourses.map(course => (
            <Link
              key={course.id}
              to={course.href ?? `/courses/${course.id}`}
              className="course-card-link"
            >
              <div className="course-card">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/*
        Task 3 (Week 19) put this notice right under the heading; this round
        of feedback moves it below the course list instead, and adds a
        Register link alongside Sign In so both auth entry points are
        reachable from the same callout.
      */}
      {!isAuthenticated && (
        <aside className="course-page-notice">
          <p>Sign in to see the full course catalog.</p>
          <div className="course-page-notice-actions">
            <Link to="/login" className="course-page-notice-btn primary">Sign in</Link>
            <Link to="/register" className="course-page-notice-btn secondary">Register</Link>
          </div>
        </aside>
      )}
    </div>
  );
}
