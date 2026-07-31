import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import Chat from './pages/Chat';
import CourseList from './pages/CourseList';
import CoursePhases from './pages/CoursePhases';
import PhaseSections from './pages/PhaseSections';
import SectionView from './pages/SectionView';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import './pages/Auth.css';

function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        {/*
          Public demo mode: these four routes now read from
          /api/public/courses** when logged out and /api/courses** when
          logged in (see src/api/courseApi.js). ProtectedRoute is removed so
          logged-out visitors reach the pages at all; each page's own fetch
          decides what data it's allowed to see.
        */}
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/:courseId" element={<CoursePhases />} />
        <Route path="/courses/:courseId/phases/:phaseId" element={<PhaseSections />} />
        <Route path="/courses/:courseId/phases/:phaseId/sections/:sectionId" element={<SectionView />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
