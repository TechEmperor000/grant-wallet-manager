const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    if (!TELEGRAM_CHAT_ID) {
      throw new Error('TELEGRAM_CHAT_ID is not configured');
    }

    const body = await req.json();
    const { full_name, email, phone, amount_requested, purpose, signed_document_url, answers } = body;

    if (!full_name || !email || !amount_requested) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: full_name, email, amount_requested' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the Telegram message
    let message = `🆕 <b>New Grant Application</b>\n\n`;
    message += `👤 <b>Name:</b> ${escapeHtml(full_name)}\n`;
    message += `📧 <b>Email:</b> ${escapeHtml(email)}\n`;
    if (phone) message += `📱 <b>Phone:</b> ${escapeHtml(phone)}\n`;
    message += `💰 <b>Amount Requested:</b> $${Number(amount_requested).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    if (purpose) message += `📝 <b>Purpose:</b> ${escapeHtml(purpose)}\n`;

    if (answers && typeof answers === 'object' && Object.keys(answers).length > 0) {
      message += `\n📋 <b>Answers:</b>\n`;
      for (const [key, value] of Object.entries(answers)) {
        message += `  • <b>${escapeHtml(key.replace(/_/g, ' '))}:</b> ${escapeHtml(String(value))}\n`;
      }
    }

    if (signed_document_url) {
      message += `\n📎 <b>Signed Document:</b> <a href="${escapeHtml(signed_document_url)}">Download</a>\n`;
    }

    message += `\n⏰ <b>Submitted:</b> ${new Date().toUTCString()}`;

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', JSON.stringify(telegramData));
      throw new Error(`Telegram API failed [${telegramResponse.status}]: ${JSON.stringify(telegramData)}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending Telegram notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
