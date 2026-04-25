import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

export default function Register() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({}); // Stores backend/frontend errors
    const navigate = useNavigate(); // Replaces Spring's RedirectAttributes

    // 1. Client-Side Validation
    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = "Username is required";
        if (formData.password.length < 6) newErrors.password = "Password must be 6+ chars";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const clientErrors = validateForm();
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return; // Stop early, save a network request!
        }

        // 2. Network Request to Spring Boot
        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            // 3. Handle Backend Validation Errors (The JSR 380 mapping)
            if (response.status === 400 || response.status === 409) {
                const backendErrors = await response.json();
                setErrors(backendErrors); 
            } 
            // 4. Handle Success Redirect
            else if (response.status === 201) {
                navigate('/?success=true'); // Instant redirect
            }
        } catch (error) {
            setErrors({ global: "Server is unreachable. Is Spring Boot running?" });
        }
    };

    return (
        <div className="register-container">
            <h2>Create AhaSpace Account</h2>
            {errors.global && <div className="error-banner">{errors.global}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    />
                    {/* Display Field Errors dynamically */}
                    {errors.username && <span className="error-text">{errors.username}</span>}
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

                <button type="submit">Register</button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Already have an account? <Link to="/login">Sign In</Link>
            </p>
        </div>
    );
}