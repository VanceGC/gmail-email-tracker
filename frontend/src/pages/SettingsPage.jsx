import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage({ session }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Settings Page</h1>
        <p className="text-gray-600">Coming soon...</p>
      </div>
    </div>
  );
}
