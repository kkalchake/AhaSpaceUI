import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursesBase, authHeaders } from '../api/courseApi';

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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {isAuthenticated ? (
        <h2>Courses</h2>
      ) : (
        <>
          <h2>Public courses</h2>
          <p style={{ marginTop: '-8px', color: 'var(--muted)' }}>
            Sign in to see the full course catalog.
          </p>
        </>
      )}

      {error && (
        <div className="error-banner" style={{ marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--muted)' }}>Loading courses...</p>
      ) : courses.length === 0 ? (
        !error && (
          <p style={{ color: 'var(--muted)' }}>
            {isAuthenticated ? 'No courses available yet.' : 'No public courses available yet. Sign in to see more.'}
          </p>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {courses.map(course => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)'
              }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{course.title}</h3>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{course.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
