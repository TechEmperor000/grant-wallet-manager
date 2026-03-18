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
    const {
      full_name, email, phone, amount_requested, purpose,
      date_of_birth, street_address, city, state_province, country, occupation,
      answers, id_card_front_url, id_card_back_url, signed_document_url,
    } = body;

    if (!full_name || !email || !amount_requested) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: full_name, email, amount_requested' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the Telegram message
    let message = `🆕 <b>New Grant Application</b>\n\n`;

    // Personal details
    message += `<b>── Personal Details ──</b>\n`;
    message += `👤 <b>Name:</b> ${esc(full_name)}\n`;
    message += `📧 <b>Email:</b> ${esc(email)}\n`;
    if (phone) message += `📱 <b>Phone:</b> ${esc(phone)}\n`;
    if (date_of_birth) message += `🎂 <b>Date of Birth:</b> ${esc(date_of_birth)}\n`;
    if (occupation) message += `💼 <b>Occupation:</b> ${esc(occupation)}\n`;

    // Address
    const addressParts = [street_address, city, state_province, country].filter(Boolean);
    if (addressParts.length > 0) {
      message += `🏠 <b>Address:</b> ${esc(addressParts.join(', '))}\n`;
    }

    // Funding
    message += `\n<b>── Funding Details ──</b>\n`;
    message += `💰 <b>Amount Requested:</b> $${Number(amount_requested).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;
    if (purpose) message += `📝 <b>Purpose:</b> ${esc(purpose)}\n`;

    // Questionnaire answers
    if (answers && typeof answers === 'object' && Object.keys(answers).length > 0) {
      message += `\n<b>── Questionnaire ──</b>\n`;
      const labels: Record<string, string> = {
        why_need_grant: 'Why do you need this grant?',
        how_use_funds: 'How will you use the funds?',
        previous_grants: 'Previous grants received?',
        impact: 'Expected impact?',
        additional_info: 'Additional info',
      };
      for (const [key, value] of Object.entries(answers)) {
        if (value) {
          const label = labels[key] || key.replace(/_/g, ' ');
          message += `• <b>${esc(label)}</b>\n  ${esc(String(value))}\n`;
        }
      }
    }

    // Document links
    const hasDocLinks = id_card_front_url || id_card_back_url || signed_document_url;
    if (hasDocLinks) {
      message += `\n<b>── Documents ──</b>\n`;
      if (id_card_front_url) message += `🪪 <a href="${esc(id_card_front_url)}">ID Card Front</a>\n`;
      if (id_card_back_url) message += `🪪 <a href="${esc(id_card_back_url)}">ID Card Back</a>\n`;
      if (signed_document_url) message += `📎 <a href="${esc(signed_document_url)}">Signed Document</a>\n`;
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

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
