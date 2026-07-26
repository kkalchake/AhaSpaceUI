import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function CoursePhases() {
  const { courseId } = useParams();
  const [phases, setPhases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const loadPhases = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/phases`, {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (res.ok) {
          setPhases(await res.json());
        } else if (res.status === 401 || res.status === 403) {
          setError('Session expired. Please log in again.');
        } else if (res.status === 404) {
          setError('Course not found.');
        } else {
          setError('Failed to load phases.');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPhases();
  }, [auth.token, courseId]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Phases</h2>

      {error && (
        <div className="error-banner" style={{ marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--muted)' }}>Loading phases...</p>
      ) : phases.length === 0 ? (
        !error && <p style={{ color: 'var(--muted)' }}>No phases available yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Backend returns phases pre-sorted by orderIndex ascending, same
              contract as CourseSections' section list - no client-side sort. */}
          {phases.map((phase) => (
            <Link
              key={phase.id}
              to={`/courses/${courseId}/phases/${phase.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)'
              }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{phase.title}</h3>
                {phase.description && (
                  <p style={{ margin: 0, color: 'var(--muted)' }}>{phase.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
