import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  // Generic, not-field-specific message for a failed login attempt. Kept
  // separate from `errors` (which drives per-field .error-text spans and the
  // pre-existing errors.global banner) so a 401 can never be rendered as
  // "email is wrong" or "password is wrong" — attributing the failure to one
  // field over the other would tell an attacker whether the email exists in
  // the system (identifier enumeration), even though the account itself
  // stayed safe.
  const [formError, setFormError] = useState('');
  const [shake, setShake] = useState(false);
  const [notification, setNotification] = useState(null);
  // Two-step flow: collect the email first, then reveal the password field.
  // The step-1 button never calls the backend (no "does this user exist"
  // request) — it's purely a client-side reveal of the password input.
  const [step, setStep] = useState('email');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    if (location.state?.message) {
      setNotification(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(formData.email)) newErrors.email = 'Enter a valid email address';
    // Password is only ever entered (and therefore only ever validated) once
    // step === 'password'; validating it during the email step would throw
    // a "6 characters" error on a field the user can't see yet.
    if (step === 'password' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    if (step === 'email') {
      setStep('password');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      if (response.status === 200) {
        const data = await response.json();
        login(data.token, data.email);
        navigate('/');
      } else if (response.status === 401) {
        // Stay on the password step and keep formData intact so the user
        // isn't forced to retype the email; only the generic form-level
        // error is shown (see formError comment above).
        setFormError('Invalid email or password');
        setShake(true);
      } else if (response.status === 400) {
        const data = await response.json();
        setErrors(data);
      }
    } catch (error) {
      setErrors({ global: 'Server is unreachable. Is Spring Boot running?' });
    }
  };

  return (
    <div className="auth-page">
      <h1 className="welcome-heading">Welcome to AhaSpace</h1>
      <div
        className={`register-container${shake ? ' shake' : ''}`}
        onAnimationEnd={() => setShake(false)}
      >
        <h2>Sign In</h2>
        {notification && (
          <div className="error-banner" style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeaa7' }}>
            {notification}
          </div>
        )}
        {errors.global && <div className="error-banner">{errors.global}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {step === 'password' && (
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>
          )}

          <button type="submit" className="btn-primary">{step === 'email' ? 'Continue' : 'Sign In'}</button>
        </form>

        {formError && <p className="form-error">{formError}</p>}

        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
