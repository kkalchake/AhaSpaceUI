import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAuth } from '../context/AuthContext';
import SectionAssistantPanel from '../components/SectionAssistantPanel';
import { API_BASE_URL } from '../config';
import './SectionView.css';

const SPLIT_STORAGE_KEY = 'sectionview-split-ratio';
const MIN_SPLIT = 25;
const MAX_SPLIT = 75;
const DEFAULT_SPLIT = 50;

/*
 * There is no GET /sections/{id} endpoint. The contract only exposes
 * GET /api/courses/{courseId}/phases/{phaseId}/sections, which returns every
 * section for the phase. Rather than inventing a new backend endpoint, this
 * page fetches that list and finds the matching section by id client-side.
 * courseId still appears in the URL for route/nesting consistency with the
 * chat endpoints, even though the lookup here is really keyed on sectionId.
 */
export default function SectionView() {
  const { courseId, phaseId, sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  // Full course section list, kept around (not just the matched section) so
  // prev/next and the "X of Y" indicator can be computed from orderIndex
  // without a second fetch.
  const [allSections, setAllSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSectionListOpen, setIsSectionListOpen] = useState(false);
  const { auth } = useAuth();
  const sectionListRef = useRef(null);

  // Click-outside-to-close: only listens while the panel is open, matching
  // the pattern already used for ChatToolbar's history dropdown.
  useEffect(() => {
    if (!isSectionListOpen) return;
    const handleClickOutside = (e) => {
      if (sectionListRef.current && !sectionListRef.current.contains(e.target)) {
        setIsSectionListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSectionListOpen]);

  const [splitRatio, setSplitRatio] = useState(() => {
    const saved = Number(localStorage.getItem(SPLIT_STORAGE_KEY));
    return saved >= MIN_SPLIT && saved <= MAX_SPLIT ? saved : DEFAULT_SPLIT;
  });
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const splitRatioRef = useRef(splitRatio);
  splitRatioRef.current = splitRatio;

  // Drag handling lives at the window level (not just on the divider) so the
  // resize keeps tracking the cursor even if it moves faster than the
  // divider's own width during a drag. Attached once on mount rather than
  // re-subscribing on every splitRatio change during the drag.
  useEffect(() => {
    const clampSplit = (value) => Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, value));

    const updateFromClientX = (clientX) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      setSplitRatio(clampSplit(percent));
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      updateFromClientX(e.clientX);
    };
    const handleTouchMove = (e) => {
      if (!isDraggingRef.current || !e.touches[0]) return;
      updateFromClientX(e.touches[0].clientX);
    };
    const stopDragging = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      localStorage.setItem(SPLIT_STORAGE_KEY, String(splitRatioRef.current));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, []);

  const startDragging = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleDividerKeyDown = (e) => {
    const step = 2;
    if (e.key === 'ArrowLeft') {
      setSplitRatio(prev => Math.max(MIN_SPLIT, prev - step));
    } else if (e.key === 'ArrowRight') {
      setSplitRatio(prev => Math.min(MAX_SPLIT, prev + step));
    } else if (e.key === 'Home') {
      setSplitRatio(MIN_SPLIT);
    } else if (e.key === 'End') {
      setSplitRatio(MAX_SPLIT);
    } else {
      return;
    }
    e.preventDefault();
  };

  // Persist whenever the ratio settles from a keyboard adjustment (drag-end
  // already persists in stopDragging above).
  useEffect(() => {
    if (isDraggingRef.current) return;
    localStorage.setItem(SPLIT_STORAGE_KEY, String(splitRatio));
  }, [splitRatio]);

  useEffect(() => {
    const loadSection = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/phases/${phaseId}/sections`, {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (res.ok) {
          const sections = await res.json();
          const found = sections.find(s => s.id === Number(sectionId));
          if (found) {
            setSection(found);
            setAllSections(sections);
          } else {
            setError('Section not found.');
          }
        } else if (res.status === 401 || res.status === 403) {
          setError('Session expired. Please log in again.');
        } else if (res.status === 404) {
          setError('Course or phase not found.');
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
  }, [auth.token, courseId, phaseId, sectionId]);

  const currentIndex = section ? allSections.findIndex(s => s.id === section.id) : -1;
  const prevSection = currentIndex > 0 ? allSections[currentIndex - 1] : null;
  const nextSection = currentIndex >= 0 && currentIndex < allSections.length - 1
    ? allSections[currentIndex + 1]
    : null;

  const ChapterNav = () => (
    <nav className="section-nav" aria-label="Chapter navigation">
      <button
        className="section-nav-btn"
        onClick={() => navigate(`/courses/${courseId}/phases/${phaseId}/sections/${prevSection.id}`)}
        disabled={!prevSection}
      >
        ← Previous
      </button>
      <span className="section-nav-progress">
        Section {currentIndex + 1} of {allSections.length}
      </span>
      <button
        className="section-nav-btn"
        onClick={() => navigate(`/courses/${courseId}/phases/${phaseId}/sections/${nextSection.id}`)}
        disabled={!nextSection}
      >
        Next →
      </button>
    </nav>
  );

  return (
    <div className="section-view" ref={containerRef}>
      <div className="section-content" style={{ flexBasis: `calc(${splitRatio}% - 4px)` }} ref={sectionListRef}>
        <button
          className="section-list-toggle"
          onClick={() => setIsSectionListOpen(prev => !prev)}
          aria-label={isSectionListOpen ? 'Hide section list' : 'Show section list'}
          aria-expanded={isSectionListOpen}
        >
          ≡
        </button>
        <div className={`section-list-panel ${isSectionListOpen ? 'open' : ''}`} role="listbox" aria-label="All sections in this phase">
          {allSections.map((s, index) => (
            <button
              key={s.id}
              role="option"
              aria-selected={section && s.id === section.id}
              className={`section-list-row ${section && s.id === section.id ? 'active' : ''}`}
              onClick={() => {
                setIsSectionListOpen(false);
                navigate(`/courses/${courseId}/phases/${phaseId}/sections/${s.id}`);
              }}
            >
              {index + 1}. {s.title}
            </button>
          ))}
        </div>
        {error && (
          <div className="error-banner" style={{ marginBottom: '10px' }}>
            {error}
          </div>
        )}
        {isLoading ? (
          <p style={{ color: 'var(--muted)' }}>Loading section...</p>
        ) : section && (
          <>
            <ChapterNav />
            <div className="section-markdown">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {section.content}
              </ReactMarkdown>
            </div>
            <ChapterNav />
          </>
        )}
      </div>
      <div
        className="section-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize course content and chat panels"
        aria-valuenow={Math.round(splitRatio)}
        aria-valuemin={MIN_SPLIT}
        aria-valuemax={MAX_SPLIT}
        tabIndex={0}
        onMouseDown={startDragging}
        onTouchStart={startDragging}
        onKeyDown={handleDividerKeyDown}
      />
      <div className="section-chat" style={{ flexBasis: `calc(${100 - splitRatio}% - 4px)` }}>
        <SectionAssistantPanel courseId={courseId} phaseId={phaseId} sectionId={sectionId} />
      </div>
    </div>
  );
}
