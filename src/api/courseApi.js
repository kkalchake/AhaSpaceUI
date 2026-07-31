import { API_BASE_URL } from '../config';

/*
 * Single place that decides public vs. authenticated course data sourcing.
 * Every course-related page (list, detail, phases, sections) builds its
 * fetch URL and headers from these two helpers instead of branching on
 * isAuthenticated itself, so the branch only needs to be gotten right once.
 */
export const coursesBase = (isAuthenticated) =>
  `${API_BASE_URL}/api/${isAuthenticated ? 'courses' : 'public/courses'}`;

export const authHeaders = (auth) =>
  (auth?.token ? { Authorization: `Bearer ${auth.token}` } : {});

/*
 * There is no GET /api/courses/{id} (single course, authenticated) route —
 * decisions.md fixes the existing /api/courses** routes as unchanged, so the
 * authenticated path fetches the full list and finds the match client-side
 * (same precedent as SectionView finding a section in its phase's list).
 * A miss is normalized to {status: 404, course: null} so callers reuse their
 * existing 404 copy path regardless of which branch produced it. Non-2xx
 * statuses are returned verbatim so callers keep their current error
 * branching (401/403 -> session expired, 5xx -> generic failure).
 */
export async function fetchCourseMeta(courseId, isAuthenticated, auth) {
  if (!isAuthenticated) {
    const res = await fetch(`${API_BASE_URL}/api/public/courses/${courseId}`);
    if (res.ok) {
      // Contract only defines 200 as the success status for this endpoint;
      // hardcoding it (rather than trusting res.status) keeps this branch
      // symmetric with the authenticated branch below, which also reports
      // success as a fixed 200 regardless of the underlying list request's
      // exact status.
      return { status: 200, course: await res.json() };
    }
    if (res.status === 404) {
      return { status: 404, course: null };
    }
    return { status: res.status, course: null };
  }

  const res = await fetch(`${API_BASE_URL}/api/courses`, { headers: authHeaders(auth) });
  if (!res.ok) {
    return { status: res.status, course: null };
  }
  const courses = await res.json();
  const found = courses.find(c => String(c.id) === String(courseId));
  return found ? { status: 200, course: found } : { status: 404, course: null };
}
