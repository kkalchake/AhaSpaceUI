import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesBase, authHeaders, fetchCourseMeta } from '../api/courseApi';
import './CoursePages.css';
import './CoursePhases.css';

export default function CoursePhases() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [phases, setPhases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth, isAuthenticated } = useAuth();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        /*
          Course metadata (title/description/source/insights) and the phase
          list come from two different endpoints - there's no single
          "course detail" response. Promise.all keeps them under one loading
          state and one error state instead of two independent spinners.
        */
        const [metaResult, phasesRes] = await Promise.all([
          fetchCourseMeta(courseId, isAuthenticated, auth),
          fetch(`${coursesBase(isAuthenticated)}/${courseId}/phases`, { headers: authHeaders(auth) })
        ]);

        if (metaResult.status === 401 || metaResult.status === 403 || phasesRes.status === 401 || phasesRes.status === 403) {
          setError('Session expired. Please log in again.');
        } else if (metaResult.status === 404 || phasesRes.status === 404) {
          setError(isAuthenticated
            ? 'Course not found.'
            : "This course isn't available to preview. Sign in to view it.");
        } else if (metaResult.status !== 200 || !phasesRes.ok) {
          setError('Failed to load phases.');
        } else {
          setCourse(metaResult.course);
          setPhases(await phasesRes.json());
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [auth?.token, isAuthenticated, courseId]);

  return (
    <div className="course-page">
      <nav className="course-page-nav" aria-label="Page navigation">
        <Link to="/courses">← Back to courses</Link>
        <Link to="/">Main page</Link>
      </nav>

      {error && (
        <div className="error-banner" style={{ marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="course-page-status">Loading phases...</p>
      ) : (
        <>
          {course && (
            <div className="course-header">
              <h1 className="course-title">{course.title}</h1>
              {course.description && (
                <p className="course-description">{course.description}</p>
              )}
              {course.sourceName && (
                <div className="course-source">
                  {course.sourceUrl ? (
                    <a href={course.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {course.sourceName}
                    </a>
                  ) : (
                    <span>{course.sourceName}</span>
                  )}
                  {course.sourceLicense && (
                    <small className="course-source-license">{course.sourceLicense}</small>
                  )}
                </div>
              )}
              {course.insights && course.insights.length > 0 && (
                <ul className="course-insights">
                  {course.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <h2 className="phases-heading">Phases</h2>

          {phases.length === 0 ? (
            !error && <p className="course-page-status">No phases available yet.</p>
          ) : (
            <div className="course-card-list">
              {/* Backend returns phases pre-sorted by orderIndex ascending, same
                  contract as CourseSections' section list - no client-side sort. */}
              {phases.map((phase) => (
                <Link
                  key={phase.id}
                  to={`/courses/${courseId}/phases/${phase.id}`}
                  className="course-card-link"
                >
                  <div className="course-card">
                    <h3>{phase.title}</h3>
                    {phase.description && (
                      <p>{phase.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
