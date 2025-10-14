// Production Resend Edge Function - Simplified and Reliable
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    console.log('🚀 Email function started');
    
    // Get API key from secrets
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment');
      throw new Error('RESEND_API_KEY not configured');
    }

    console.log('✅ API key found:', RESEND_API_KEY.substring(0, 8) + '...');

    // Parse request body
    const body = await req.json();
    const { to, subject, html, text } = body as EmailRequest;

    // Convert to array for consistent handling
    const recipients = Array.isArray(to) ? to : [to];
    
    console.log('📨 Email request:', { 
      to: recipients.join(', '), 
      recipientCount: recipients.length,
      subject: subject?.substring(0, 50) 
    });

    // Validate required fields
    if (!to || !subject || !html) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, html' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate all email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        console.error('❌ Invalid email address:', email);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Invalid email address: ${email}` 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Send email via Resend API - using onboarding domain (always works)
    const emailPayload = {
      from: 'MedCure Pharmacy <onboarding@resend.dev>',
      to: recipients, // Resend supports multiple recipients natively
      subject,
      html,
      ...(text ? { text } : {}),
    };

    console.log('📤 Sending to Resend API...');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('📥 Resend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Resend API error:', response.status, errorData);
      
      throw new Error(`Resend API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully! ID:', result.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: result.id,
        message: `Email sent successfully to ${recipients.length} recipient(s) via Resend`,
        provider: 'resend-edge-function',
        recipients: recipients,
        recipientCount: recipients.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});