import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesBase, authHeaders, fetchCourseMeta } from '../api/courseApi';
import './CoursePages.css';

export default function PhaseSections() {
  const { courseId, phaseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadSections = async () => {
      setIsLoading(true);
      setError(null);
      try {
        /*
         * Course meta is fetched in parallel with the sections list (same
         * Promise.all shape as CoursePhases.jsx), but it is best-effort only:
         * a meta failure must not set `error` or block the section list from
         * rendering, because the sections response alone is the documented
         * contract for this page's loading/error state. Only a 200 sets
         * `course`; any other status silently leaves it null and the course
         * name line just doesn't render (graceful degradation, not an error).
         */
        const [metaResult, sectionsRes] = await Promise.all([
          fetchCourseMeta(courseId, isAuthenticated, auth),
          fetch(`${coursesBase(isAuthenticated)}/${courseId}/phases/${phaseId}/sections`, { headers: authHeaders(auth) })
        ]);

        if (metaResult.status === 200) {
          setCourse(metaResult.course);
        }

        if (sectionsRes.ok) {
          setSections(await sectionsRes.json());
        } else if (sectionsRes.status === 401 || sectionsRes.status === 403) {
          setError('Session expired. Please log in again.');
        } else if (sectionsRes.status === 404) {
          setError('Phase not found.');
        } else {
          setError('Failed to load sections.');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    loadSections();
  }, [auth?.token, isAuthenticated, courseId, phaseId]);

  return (
    <div className="course-page">
      {/*
        Course context now renders above the nav row (feedback: it should be
        the first thing a visitor sees, not sandwiched between the nav and
        the heading), and .course-page-context in CoursePages.css was bumped
        from a small muted caption to a bold 20px line so it's immediately
        legible as "here's what course you're in."
      */}
      {course && <p className="course-page-context">Course: {course.title}</p>}

      <nav className="course-page-nav" aria-label="Page navigation">
        <Link to={`/courses/${courseId}`}>← Back to phases</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/">Main page</Link>
      </nav>

      <h2>Sections</h2>

      {error && (
        <div className="error-banner" style={{ marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="course-page-status">Loading sections...</p>
      ) : sections.length === 0 ? (
        !error && <p className="course-page-status">No sections available yet.</p>
      ) : (
        <div className="course-card-list">
          {/*
            title/orderIndex were added to the sections backend model this week.
            orderIndex is 1-based but only unique within a phase, not globally,
            so section.id (globally unique) remains the React key. The backend
            returns sections pre-sorted by orderIndex ascending, so no client-side
            sort is applied here.
          */}
          {sections.map((section) => (
            <Link
              key={section.id}
              to={`/courses/${courseId}/phases/${phaseId}/sections/${section.id}`}
              className="course-card-link"
            >
              <div className="course-card">
                <h3>{section.orderIndex}. {section.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
