import { Resend } from "npm:resend";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { email, fullName, personalMessage, invitationToken } = await req.json();

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const isDevelopment = !resendApiKey || Deno.env.get('ENV') === 'development';
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';

    if (isDevelopment) {
      console.log('Development mode: Sending invitation email');
      console.log('To:', email);
      console.log('Full Name:', fullName);
      console.log('Personal Message:', personalMessage);
      console.log('Invitation Token:', invitationToken);
      const invitationLink = `${frontendUrl}/invite/${invitationToken}`;

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'development',
          details: { invitationLink }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      const resend = new Resend(resendApiKey);

      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: 'You\'re Invited!',
        html: `
          <div>
            <h1>Welcome ${fullName || 'there'}!</h1>
            <p>${personalMessage || 'You have been invited to join our platform.'}</p>
            <p>Click the link below to accept your invitation:</p>
            <a href="${frontendUrl}/invite/${invitationToken}">Accept Invitation</a>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'production',
          emailId: data.id
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (err) {
    console.error('Function error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
