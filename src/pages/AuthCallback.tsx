import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useData } from '../contexts/DataContext';
import { Users } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { markInvitationAsUsed } = useData();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login?error=auth_callback_failed');
          return;
        }

        if (data.session?.user) {
          // Check if this was from an invitation
          const invitationToken = searchParams.get('token') || searchParams.get('invitation_token');
          
          if (invitationToken) {
            try {
              await markInvitationAsUsed(invitationToken);
            } catch (error) {
              console.error('Error marking invitation as used:', error);
            }
          }

          // Redirect to dashboard
          navigate('/');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=auth_callback_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, markInvitationAsUsed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Sign In</h2>
          <p className="text-gray-600">Please wait while we finish setting up your account...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;