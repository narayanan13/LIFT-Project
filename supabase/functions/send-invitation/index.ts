import { Resend } from "npm:resend";

declare const Deno: any;

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, fullName, personalMessage, invitationToken } = await req.json();

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const isDevelopment = !resendApiKey || Deno.env.get('ENV') === 'development';

    if (isDevelopment) {
      console.log('Development mode: Sending invitation email');
      console.log('To:', email);
      console.log('Full Name:', fullName);
      console.log('Personal Message:', personalMessage);
      console.log('Invitation Token:', invitationToken);
      const invitationLink = `http://localhost:3000/invitation?token=${invitationToken}`;

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'development',
          details: { invitationLink }
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      const resend = new Resend(resendApiKey);

      const { data, error } = await resend.emails.send({
        from: 'noreply@yourapp.com', // Replace with your verified sender
        to: [email],
        subject: 'You\'re Invited!',
        html: `
          <div>
            <h1>Welcome ${fullName || 'there'}!</h1>
            <p>${personalMessage || 'You have been invited to join our platform.'}</p>
            <p>Click the link below to accept your invitation:</p>
            <a href="https://yourapp.com/invitation?token=${invitationToken}">Accept Invitation</a>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'production',
          emailId: data.id
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error('Function error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
