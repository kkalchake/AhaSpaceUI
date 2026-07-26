import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function PhaseSections() {
  const { courseId, phaseId } = useParams();
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const loadSections = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/phases/${phaseId}/sections`, {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (res.ok) {
          setSections(await res.json());
        } else if (res.status === 401 || res.status === 403) {
          setError('Session expired. Please log in again.');
        } else if (res.status === 404) {
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
  }, [auth.token, courseId, phaseId]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Sections</h2>

      {error && (
        <div className="error-banner" style={{ marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--muted)' }}>Loading sections...</p>
      ) : sections.length === 0 ? (
        !error && <p style={{ color: 'var(--muted)' }}>No sections available yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)'
              }}>
                <h3 style={{ margin: 0 }}>{section.orderIndex}. {section.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
