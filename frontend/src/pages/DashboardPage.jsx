import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Mail, LogOut } from 'lucide-react';

export default function DashboardPage({ session }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }

    // Fetch user profile
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setUser(data);
      }
    };

    fetchUser();
  }, [session, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VGCMail
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user.full_name || 'User'}!</h1>
          <p className="text-gray-600 mt-2">
            Your email tracking dashboard
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Plan</h3>
            <p className="text-2xl font-bold capitalize">{user.subscription_tier}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Emails Tracked This Month</h3>
            <p className="text-2xl font-bold">{user.emails_tracked_this_month || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              of {user.tracking_limit === -1 ? 'unlimited' : user.tracking_limit}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Status</h3>
            <p className="text-2xl font-bold capitalize">{user.subscription_status}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium">Install Chrome Extension</h3>
                <p className="text-sm text-gray-600">
                  Download and install our Chrome extension to start tracking emails in Gmail.
                </p>
                <Button className="mt-2" size="sm">
                  Download Extension
                </Button>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium">Configure Extension</h3>
                <p className="text-sm text-gray-600">
                  Open the extension and enter your API key to connect it to your account.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium">Start Tracking</h3>
                <p className="text-sm text-gray-600">
                  Send emails from Gmail as usual. Opens and clicks will be tracked automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
