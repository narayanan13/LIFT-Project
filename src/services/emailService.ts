

import { supabase } from '../lib/supabase';

export interface InvitationEmailData {
  email: string;
  fullName?: string;
  personalMessage?: string;
  invitationToken: string;
}

export const sendInvitationEmail = async (data: InvitationEmailData): Promise<boolean> => {
  try {
    console.log('🚀 Sending invitation email to:', data.email);

    // Call Supabase Edge Function
    const { data: response, error } = await supabase.functions.invoke('send-invitation', {
      body: data
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      throw error;
    }

    if (response?.success) {
      console.log('✅ Email sent successfully:', response);

      // Show detailed success info based on mode
      if (response.mode === 'development') {
        console.log('📧 Development Mode - Email details logged to console');
        console.log('🔗 Invitation Link:', response.details.invitationLink);
      } else {
        console.log('📧 Production Mode - Real email sent via Resend');
        console.log('📬 Email ID:', response.emailId);
      }

      return true;
    } else {
      console.error('❌ Email sending failed:', response);
      return false;
    }
  } catch (error) {
    console.error('❌ Error in sendInvitationEmail:', error);
    return false;
  }
};
