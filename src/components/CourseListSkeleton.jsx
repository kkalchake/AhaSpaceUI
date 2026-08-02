import React from 'react';
import './CourseListSkeleton.css';

/*
 * Reuses .course-card-list / .course-card from CoursePages.css so the
 * placeholder blocks match the real cards' geometry exactly (same padding,
 * border, border-radius) - the shimmer bars are the only new markup, laid
 * out inside the existing card shape rather than a bespoke skeleton layout.
 *
 * aria-hidden because this is a purely visual placeholder; the screen-reader
 * announcement comes from the sibling role="status" text CourseList.jsx
 * renders alongside it, not from anything in here.
 */
export default function CourseListSkeleton({ count = 3 }) {
  return (
    <div className="course-card-list" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="course-card course-card-skeleton">
          <div className="skeleton-bar skeleton-bar-title" />
          <div className="skeleton-bar skeleton-bar-text" />
          <div className="skeleton-bar skeleton-bar-text skeleton-bar-short" />
        </div>
      ))}
    </div>
  );
}
