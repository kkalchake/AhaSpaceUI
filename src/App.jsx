import { Routes, Route, Link, useSearchParams } from 'react-router-dom';
import Register from './pages/Register';

function Home() {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success');

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to AhaSpace</h1>
      {isSuccess && <h3 style={{ color: 'green' }}>Registration Successful! Please log in.</h3>}
      <Link to="/register"><button>Go to Register</button></Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}