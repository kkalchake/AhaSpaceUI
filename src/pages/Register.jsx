import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { login } = useAuth();

    const validateForm = () => {
        const newErrors = {};
        // Mirrors the backend's @Email annotation client-side so an obviously
        // malformed address is caught before a round trip, not to replace it.
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!EMAIL_REGEX.test(formData.email)) newErrors.email = "Enter a valid email address";
        if (formData.password.length < 6) newErrors.password = "Password must be 6+ chars";
        if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = "Passwords do not match";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const clientErrors = validateForm();
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Only email/password go to the backend; confirmPassword is a
                // client-side-only check and isn't part of the registration DTO.
                body: JSON.stringify({ email: formData.email, password: formData.password })
            });

            if (response.status === 400 || response.status === 409) {
                const backendErrors = await response.json();
                setErrors(backendErrors);
            }
            else if (response.status === 201) {
                const data = await response.json();
                login(data.token, data.email);
                navigate('/');
            }
        } catch (error) {
            setErrors({ global: "Server is unreachable. Is Spring Boot running?" });
        }
    };

    return (
        <div className="auth-page">
            <h1 className="welcome-heading">Welcome to AhaSpace</h1>
            <div className="register-container">
                <h2>Create Account</h2>
                {errors.global && <div className="error-banner">{errors.global}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                        {errors.password && <span className="error-text">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        />
                        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                    </div>

                    <button type="submit" className="btn-primary">Register</button>
                </form>

                <p style={{ marginTop: '20px', textAlign: 'center' }}>
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
