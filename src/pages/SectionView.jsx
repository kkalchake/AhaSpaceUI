import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '../context/AuthContext';
import SectionAssistantPanel from '../components/SectionAssistantPanel';

/*
 * There is no GET /sections/{id} endpoint. The Week-9 contract only exposes
 * GET /api/courses/{courseId}/sections, which returns every section for the
 * course. Rather than inventing a new backend endpoint, this page fetches
 * that list and finds the matching section by id client-side. courseId
 * still appears in the URL for route/nesting consistency with the chat
 * endpoints, even though the lookup here is really keyed on sectionId.
 */
export default function SectionView() {
  const { courseId, sectionId } = useParams();
  const [section, setSection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const loadSection = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8080/api/courses/${courseId}/sections`, {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (res.ok) {
          const sections = await res.json();
          const found = sections.find(s => s.id === Number(sectionId));
          if (found) {
            setSection(found);
          } else {
            setError('Section not found.');
          }
        } else if (res.status === 401 || res.status === 403) {
          setError('Session expired. Please log in again.');
        } else if (res.status === 404) {
          setError('Course not found.');
        } else {
          setError('Failed to load section.');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    loadSection();
  }, [auth.token, courseId, sectionId]);

  return (
    <div style={{ display: 'flex', height: '90vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', borderRight: '1px solid #ddd' }}>
        {error && (
          <div className="error-banner" style={{ marginBottom: '10px' }}>
            {error}
          </div>
        )}
        {isLoading ? (
          <p style={{ color: '#999' }}>Loading section...</p>
        ) : section && (
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {section.content}
          </ReactMarkdown>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'hidden' }}>
        <SectionAssistantPanel courseId={courseId} sectionId={sectionId} />
      </div>
    </div>
  );
}
