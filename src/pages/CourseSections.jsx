import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CourseSections() {
  const { courseId } = useParams();
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const loadSections = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8080/api/courses/${courseId}/sections`, {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (res.ok) {
          setSections(await res.json());
        } else if (res.status === 401 || res.status === 403) {
          setError('Session expired. Please log in again.');
        } else if (res.status === 404) {
          setError('Course not found.');
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
  }, [auth.token, courseId]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Sections</h2>

      {error && (
        <div className="error-banner" style={{ marginBottom: '10px' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: '#999' }}>Loading sections...</p>
      ) : sections.length === 0 ? (
        !error && <p style={{ color: '#999' }}>No sections available yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/*
            Sections have no title field in the backend model (Week-9 contract:
            { id, content, courseId }), so the list uses a 1-based index plus a
            truncated snippet of the markdown content as a stand-in label.
          */}
          {sections.map((section, index) => (
            <Link
              key={section.id}
              to={`/courses/${courseId}/sections/${section.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#fff'
              }}>
                <h3 style={{ margin: '0 0 8px 0' }}>Section {index + 1}</h3>
                <p style={{ margin: 0, color: '#666' }}>
                  {section.content.slice(0, 120)}{section.content.length > 120 ? '...' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
