// Minimal test version to debug the issue
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log('🔍 Edge Function Debug - Starting...');
    
    // Get environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL');
    
    console.log('🔍 Environment Check:', {
      hasApiKey: !!RESEND_API_KEY,
      apiKeyPrefix: RESEND_API_KEY ? RESEND_API_KEY.substring(0, 8) : 'MISSING',
      fromEmail: FROM_EMAIL || 'MISSING'
    });

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not found in environment');
    }

    // Parse request body
    const body = await req.json();
    console.log('🔍 Request Body:', body);

    const { to, subject, html, text } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      const error = 'Missing required fields: to, subject, html';
      console.error('❌ Validation Error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 Validated fields - calling Resend API...');

    // Send email via Resend API
    const resendBody = {
      from: `MedCure Pharmacy <${FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [to],
      subject,
      html,
      ...(text ? { text } : {}),
    };
    
    console.log('🔍 Resend request body:', resendBody);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendBody),
    });

    console.log('🔍 Resend response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Resend API error: ${response.status} ${errorData}` 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await response.json();
    console.log('✅ Resend success:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: result.id,
        message: 'Email sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Edge Function error:', error);
    console.error('❌ Error stack:', error.stack);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});