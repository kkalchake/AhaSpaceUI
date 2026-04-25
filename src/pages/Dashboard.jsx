import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { auth, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to AhaSpace, {auth?.username}!</h1>
      <p>You are now logged in and can access protected content.</p>
      <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Logout
      </button>
    </div>
  );
}
