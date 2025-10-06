import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Mail, LogOut, RefreshCw, Eye, MousePointerClick, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [trackedEmails, setTrackedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
        return;
      }
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!session) return;

    fetchUserData();
    fetchTrackedEmails();
  }, [session]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchTrackedEmails = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tracked-emails', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      setTrackedEmails(response.data.emails || []);
    } catch (error) {
      console.error('Error fetching tracked emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncEmails = async () => {
    try {
      setSyncing(true);
      
      // Get the provider token from the session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.provider_token) {
        alert('Gmail access token not found. Please sign out and sign in again with Google.');
        setSyncing(false);
        return;
      }

      await api.post('/gmail/sync-emails', {
        providerToken: currentSession.provider_token,
        providerRefreshToken: currentSession.provider_refresh_token,
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      // Refresh tracked emails
      await fetchTrackedEmails();
      await fetchUserData();
      alert('Emails synced successfully!');
    } catch (error) {
      console.error('Error syncing emails:', error);
      alert(error.response?.data?.error || 'Error syncing emails. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!user || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <h1 className="text-3xl font-bold">Welcome, {user.full_name || session.user.email?.split('@')[0]}!</h1>
          <p className="text-gray-600 mt-2">
            Your email tracking dashboard
          </p>
        </div>

        {/* Stats Cards */}
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

        {/* Tracked Emails Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Tracked Emails</h2>
              <p className="text-sm text-gray-600 mt-1">
                Your sent emails with tracking data
              </p>
            </div>
            <Button 
              onClick={handleSyncEmails} 
              disabled={syncing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Gmail'}</span>
            </Button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : trackedEmails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tracked emails yet</h3>
                <p className="text-gray-600 mb-4">
                  Click "Sync Gmail" to import your sent emails and start tracking
                </p>
                <Button onClick={handleSyncEmails} disabled={syncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {trackedEmails.map((email) => (
                  <div
                    key={email.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {email.subject || '(No Subject)'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          To: {email.recipient}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Eye className="h-4 w-4" />
                          <span>{email.open_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-purple-600">
                          <MousePointerClick className="h-4 w-4" />
                          <span>{email.click_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(email.sent_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
