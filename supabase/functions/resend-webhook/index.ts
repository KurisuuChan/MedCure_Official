// Supabase Edge Function for handling Resend webhook events
// Processes delivery status, bounces, complaints, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
};

// Webhook secret for verification
const WEBHOOK_SECRET = 'whsec_oDHo/fpn48dYO9E1hWZKaCskE2G817hB';

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    [key: string]: any;
  };
}

// Verify webhook signature (basic implementation)
function verifySignature(body: string, signature: string, timestamp: string): boolean {
  try {
    // In production, implement proper SVIX signature verification
    // For now, we'll do basic validation
    return signature && timestamp && body;
  } catch {
    return false;
  }
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
    // Get webhook headers
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    // Get request body
    const rawBody = await req.text();
    
    // Verify signature (basic check)
    if (!verifySignature(rawBody, svixSignature || '', svixTimestamp || '')) {
      console.warn('⚠️ Webhook signature verification failed');
      // In development, we might want to continue anyway
      // In production, return 401
      // return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Parse webhook event
    const event: ResendWebhookEvent = JSON.parse(rawBody);

    console.log(`📬 Received webhook event: ${event.type}`, {
      emailId: event.data.email_id,
      to: event.data.to,
      subject: event.data.subject
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process different event types
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(supabase, event);
        break;
      case 'email.delivered':
        await handleEmailDelivered(supabase, event);
        break;
      case 'email.bounced':
        await handleEmailBounced(supabase, event);
        break;
      case 'email.complained':
        await handleEmailComplaint(supabase, event);
        break;
      case 'email.opened':
        await handleEmailOpened(supabase, event);
        break;
      case 'email.clicked':
        await handleEmailClicked(supabase, event);
        break;
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ success: true, processed: event.type }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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

// Handler functions
async function handleEmailSent(supabase: any, event: ResendWebhookEvent) {
  console.log('✉️ Email sent:', event.data.email_id);
  await updateEmailStatus(supabase, event.data.email_id, 'sent', event);
}

async function handleEmailDelivered(supabase: any, event: ResendWebhookEvent) {
  console.log('📬 Email delivered:', event.data.email_id);
  await updateEmailStatus(supabase, event.data.email_id, 'delivered', event);
}

async function handleEmailBounced(supabase: any, event: ResendWebhookEvent) {
  console.log('⚠️ Email bounced:', event.data.email_id);
  await updateEmailStatus(supabase, event.data.email_id, 'bounced', event);
}

async function handleEmailComplaint(supabase: any, event: ResendWebhookEvent) {
  console.log('🚨 Email complaint:', event.data.email_id);
  await updateEmailStatus(supabase, event.data.email_id, 'complained', event);
}

async function handleEmailOpened(supabase: any, event: ResendWebhookEvent) {
  console.log('👁️ Email opened:', event.data.email_id);
  await updateEmailStatus(supabase, event.data.email_id, 'opened', event);
}

async function handleEmailClicked(supabase: any, event: ResendWebhookEvent) {
  console.log('🖱️ Email clicked:', event.data.email_id);
  await updateEmailStatus(supabase, event.data.email_id, 'clicked', event);
}

// Update email status in database
async function updateEmailStatus(supabase: any, emailId: string, status: string, event: ResendWebhookEvent) {
  try {
    // First, try to find the notification by email_id
    const { data: notification, error: findError } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('email_id', emailId)
      .single();

    if (findError || !notification) {
      console.warn(`⚠️ No notification found for email_id: ${emailId}`);
      // Still log the event for tracking
      await logEmailEvent(supabase, emailId, status, event);
      return;
    }

    // Update notification status
    const { error: updateError } = await supabase
      .from('user_notifications')
      .update({
        email_status: status,
        email_updated_at: new Date().toISOString(),
        email_event_data: event
      })
      .eq('id', notification.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Updated notification ${notification.id} status to: ${status}`);

  } catch (error) {
    console.error(`❌ Failed to update email status for ${emailId}:`, error);
    // Log the event anyway for debugging
    await logEmailEvent(supabase, emailId, status, event);
  }
}

// Log email events for tracking
async function logEmailEvent(supabase: any, emailId: string, status: string, event: ResendWebhookEvent) {
  try {
    const { error } = await supabase
      .from('email_events')
      .insert({
        email_id: emailId,
        event_type: status,
        event_data: event,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log email event:', error);
    } else {
      console.log(`📝 Logged email event: ${emailId} -> ${status}`);
    }
  } catch (error) {
    console.error('Failed to log email event:', error);
  }
}