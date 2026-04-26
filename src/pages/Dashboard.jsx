import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to AhaSpace, {auth?.username}!</h1>
      <p>You are now logged in and can access protected content.</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => navigate('/chat')} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          AI Chat
        </button>
        <button onClick={handleLogout} style={{ padding: '10px 20px' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
